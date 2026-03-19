const prisma = require("../../config/prisma");
const redis = require("../../config/redis");
const crypto = require("crypto");
const { addOneHour, isWeekend, parseISODateOnly, formatDate } = require("../../utils/slots");
const { makeSlotKey, makeItemKey, makeUserSetKey, releaseSlotIfOwner, getUserCartItems } = require("../../utils/redisCart");

const OPEN_HOUR = 6;
const CLOSE_HOUR = 23;
const HOLD_MINUTES = 10;
const HOLD_SECONDS = HOLD_MINUTES * 60;

// Validate time
const validStartTime = (hhmm) => {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return false;
  const [hh, mm] = hhmm.split(":").map(Number);
  if (mm !== 0) return false;
  return hh >= OPEN_HOUR && hh < CLOSE_HOUR;
};

const buildCartItem = ({ itemId, userId, venueId, date, court, startTime, price, expiresAt }) => ({
  id: itemId,
  userId,
  venueId,
  date,
  court,
  startTime,
  endTime: addOneHour(startTime),
  price,
  expiresAt,
});

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { venueId, items } = req.body;

    const vId = Number.parseInt(venueId, 10);
    if (!Number.isFinite(vId)) {
      return res.status(400).json({ message: "Invalid venueId" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items[] is required" });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: vId },
      select: { id: true, weekdayRate: true, weekendRate: true },
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    // Normalize + validate
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalized = [];

    for (const it of items) {
      const dateObj = parseISODateOnly(it.date);

      if (!dateObj) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const court = Number.parseInt(it.court, 10);

      if (!Number.isFinite(court) || court < 1 || court > 3) {
        return res.status(400).json({ message: "court must be 1..3" });
      }

      if (!it.startTime) {
        return res.status(400).json({ message: "startTime is required" });
      }

      if (!validStartTime(it.startTime)) {
        return res.status(400).json({ message: "Invalid startTime" });
      }

      //  BLOCK PAST DATE
      if (dateObj < today) {
        return res.status(400).json({
          message: "Cannot book past dates",
        });
      }

      // BLOCK PAST TIME (TODAY)
      const isToday =
        dateObj.getFullYear() === today.getFullYear() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getDate() === today.getDate();

      if (isToday) {
        const [hh] = it.startTime.split(":").map(Number);
        const slotTime = new Date(dateObj);
        slotTime.setHours(hh, 0, 0, 0);

        if (slotTime <= now) {
          return res.status(400).json({
            message: `Slot ${it.startTime} already passed`,
          });
        }
      }

      normalized.push({
        dateObj,
        date: formatDate(dateObj),
        court,
        startTime: it.startTime,
      });
    }

    // Booking conflict check (DB)
    const bookingConflicts = await prisma.booking.findMany({
      where: {
        OR: normalized.map((it) => ({
          venueId: vId,
          date: it.dateObj,
          court: it.court,
          startTime: it.startTime,
        })),
      },
      select: { date: true, court: true, startTime: true },
    });

    if (bookingConflicts.length) {
      return res.status(409).json({
        message: "Slot not available",
        reason: "ALREADY_BOOKED",
        conflicts: bookingConflicts.map((c) => ({
          date: formatDate(c.date),
          court: c.court,
          startTime: c.startTime,
        })),
      });
    }

    // Redis cart conflict check + lock (no DB cart check)
    const createdItems = [];
    const conflicts = [];
    const userSetKey = makeUserSetKey(userId);

    for (const it of normalized) {
      const slotKey = makeSlotKey({
        venueId: vId,
        date: it.date,
        court: it.court,
        startTime: it.startTime,
      });

      const itemId = crypto.randomUUID();
      const lockValue = JSON.stringify({ userId, itemId });

      const lockResult = await redis.set(slotKey, lockValue, { NX: true, EX: HOLD_SECONDS });

      if (lockResult !== "OK") {
        const existingRaw = await redis.get(slotKey);
        if (existingRaw) {
          try {
            const existing = JSON.parse(existingRaw);
            if (String(existing.userId) !== String(userId)) {
              conflicts.push({ date: it.date, court: it.court, startTime: it.startTime });
              continue;
            }
          } catch {
            conflicts.push({ date: it.date, court: it.court, startTime: it.startTime });
            continue;
          }
        }

        conflicts.push({ date: it.date, court: it.court, startTime: it.startTime });
        continue;
      }

      const price = isWeekend(it.dateObj) ? venue.weekendRate : venue.weekdayRate;
      const expiresAtIso = new Date(Date.now() + HOLD_SECONDS * 1000).toISOString();

      const cartItem = buildCartItem({
        itemId,
        userId,
        venueId: vId,
        date: it.date,
        court: it.court,
        startTime: it.startTime,
        price,
        expiresAt: expiresAtIso,
      });

      const itemKey = makeItemKey(itemId);
      await redis.set(itemKey, JSON.stringify(cartItem), { EX: HOLD_SECONDS });
      await redis.sAdd(userSetKey, itemId);
      createdItems.push(cartItem);
    }

    if (conflicts.length) {
      // Keep behavior all-or-nothing for add batch
      for (const item of createdItems) {
        await releaseSlotIfOwner(item);
        await redis.del(makeItemKey(item.id));
        await redis.sRem(userSetKey, item.id);
      }

      return res.status(409).json({
        message: "Slot not available",
        reason: "IN_CART",
        conflicts,    
      });
    }

    // Success
    return res.status(201).json({
      message: "Added to cart",
      expiresAt: expiresAt.toISOString(),
      items: createdItems,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await getUserCartItems(userId);

    items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.court - b.court;
    });

    const total = items.reduce((sum, it) => sum + it.price, 0);

    return res.status(200).json({
      items,
      total,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const itemRaw = await redis.get(makeItemKey(id));
    if (!itemRaw) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    let item;
    try {
      item = JSON.parse(itemRaw);
    } catch {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (String(item.userId) !== String(userId)) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await releaseSlotIfOwner(item);
    await redis.del(makeItemKey(id));
    await redis.sRem(makeUserSetKey(userId), id);

    return res.status(200).json({ message: "Removed from cart" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

