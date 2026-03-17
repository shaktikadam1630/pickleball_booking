const prisma = require("../../config/prisma");
const { addOneHour, isWeekend, parseISODateOnly } = require("../../utils/slots");

const COURT_MIN = 1;
const COURT_MAX = 3;
const OPEN_HOUR = 6;
const CLOSE_HOUR = 23;
const HOLD_MINUTES = 10;

const validStartTime = (hhmm) => {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return false;
  const [hh, mm] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
  if (mm !== 0) return false;
  return hh >= OPEN_HOUR && hh < CLOSE_HOUR;
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { venueId, date, items } = req.body;

    const vId = Number.parseInt(venueId, 10);
    if (!Number.isFinite(vId)) return res.status(400).json({ message: "Invalid venueId" });

    const day = parseISODateOnly(date);
    if (!day) return res.status(400).json({ message: "Invalid date (YYYY-MM-DD)" });

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items[] is required" });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: vId },
      select: { id: true, weekdayRate: true, weekendRate: true },
    });
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const weekend = isWeekend(day);
    const price = weekend ? venue.weekendRate : venue.weekdayRate;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    // Cleanup expired cart items (best-effort)
    await prisma.cartItem.deleteMany({ where: { expiresAt: { lte: now } } });

    const normalized = items.map((it) => ({
      court: Number.parseInt(it.court, 10),
      startTime: it.startTime,
    }));

    for (const it of normalized) {
      if (!Number.isFinite(it.court) || it.court < COURT_MIN || it.court > COURT_MAX) {
        return res.status(400).json({ message: "court must be 1..3" });
      }
      if (!validStartTime(it.startTime)) {
        return res.status(400).json({ message: "startTime must be hourly between 06:00 and 22:00" });
      }
    }

    // Atomic: verify availability and create holds
    const created = await prisma.$transaction(async (tx) => {
      // Check bookings conflicts
      const bookingConflicts = await tx.booking.findMany({
        where: {
          venueId: vId,
          date: day,
          OR: normalized.map((it) => ({ court: it.court, startTime: it.startTime })),
        },
        select: { court: true, startTime: true },
      });
      if (bookingConflicts.length) {
        return { ok: false, reason: "BOOKED", conflicts: bookingConflicts };
      }

      // Check cart conflicts (other users)
      const cartConflicts = await tx.cartItem.findMany({
        where: {
          venueId: vId,
          date: day,
          expiresAt: { gt: now },
          OR: normalized.map((it) => ({ court: it.court, startTime: it.startTime })),
        },
        select: { court: true, startTime: true, userId: true },
      });
      const takenByOther = cartConflicts.filter((c) => c.userId !== userId);
      if (takenByOther.length) {
        return {
          ok: false,
          reason: "IN_CART",
          conflicts: takenByOther.map((c) => ({ court: c.court, startTime: c.startTime })),
        };
      }

      // Upsert-like: if same user already has it, extend expiry; else create
      const results = [];
      for (const it of normalized) {
        const endTime = addOneHour(it.startTime);
        const existing = await tx.cartItem.findUnique({
          where: {
            venueId_date_court_startTime: {
              venueId: vId,
              date: day,
              court: it.court,
              startTime: it.startTime,
            },
          },
        });

        if (existing) {
          if (existing.userId !== userId) {
            return { ok: false, reason: "IN_CART", conflicts: [{ court: it.court, startTime: it.startTime }] };
          }
          const updated = await tx.cartItem.update({
            where: { id: existing.id },
            data: { expiresAt, price },
          });
          results.push(updated);
        } else {
          const createdItem = await tx.cartItem.create({
            data: {
              userId,
              venueId: vId,
              date: day,
              court: it.court,
              startTime: it.startTime,
              endTime,
              price,
              expiresAt,
            },
          });
          results.push(createdItem);
        }
      }
      return { ok: true, items: results };
    });

    if (!created.ok) {
      return res.status(409).json({
        message: "Slot not available",
        reason: created.reason,
        conflicts: created.conflicts,
      });
    }

    return res.status(201).json({
      message: "Added to cart",
      expiresAt: expiresAt.toISOString(),
      items: created.items.map((i) => ({
        id: i.id,
        venueId: i.venueId,
        date,
        court: i.court,
        startTime: i.startTime,
        endTime: i.endTime,
        price: i.price,
        expiresAt: i.expiresAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    await prisma.cartItem.deleteMany({ where: { expiresAt: { lte: now } } });

    const items = await prisma.cartItem.findMany({
      where: { userId, expiresAt: { gt: now } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }, { court: "asc" }],
      select: {
        id: true,
        venueId: true,
        date: true,
        court: true,
        startTime: true,
        endTime: true,
        price: true,
        expiresAt: true,
      },
    });

    const total = items.reduce((sum, it) => sum + it.price, 0);

    return res.status(200).json({
      items: items.map((it) => ({
        ...it,
        date: it.date.toISOString().slice(0, 10),
      })),
      total,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await prisma.cartItem.delete({ where: { id } });
    return res.status(200).json({ message: "Removed from cart" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

