const prisma = require("../../config/prisma");
const { addOneHour, isWeekend, parseISODateOnly, formatDate } = require("../../utils/slots");

const OPEN_HOUR = 6;
const CLOSE_HOUR = 23;
const HOLD_MINUTES = 10;

// Validate time
const validStartTime = (hhmm) => {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return false;
  const [hh, mm] = hhmm.split(":").map(Number);
  if (mm !== 0) return false;
  return hh >= OPEN_HOUR && hh < CLOSE_HOUR;
};

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

    //  Cleanup expired locks
    await prisma.cartItem.deleteMany({
      where: { expiresAt: { lte: now } },
    });

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
        date: dateObj,
        court,
        startTime: it.startTime,
      });
    }

    // 🚀 TRANSACTION
    const created = await prisma.$transaction(async (tx) => {

      // Booking conflict check
      const bookingConflicts = await tx.booking.findMany({
        where: {
          OR: normalized.map((it) => ({
            venueId: vId,
            date: it.date,
            court: it.court,
            startTime: it.startTime,
          })),
        },
        select: { date: true, court: true, startTime: true },
      });

      if (bookingConflicts.length) {
        return {
          ok: false,
          reason: "ALREADY_BOOKED",
          conflicts: bookingConflicts,
        };
      }

      // Cart conflict check
      const cartConflicts = await tx.cartItem.findMany({
        where: {
          expiresAt: { gt: now },
          OR: normalized.map((it) => ({
            venueId: vId,
            date: it.date,
            court: it.court,
            startTime: it.startTime,
          })),
        },
        select: { date: true, court: true, startTime: true, userId: true },
      });

      const takenByOther = cartConflicts.filter(c => c.userId !== userId);

      if (takenByOther.length) {
        return {
          ok: false,
          reason: "IN_CART",
          conflicts: takenByOther,
        };
      }

      //  Insert items
      const results = [];

      for (const it of normalized) {
        const price = isWeekend(it.date)
          ? venue.weekendRate
          : venue.weekdayRate;

        const endTime = addOneHour(it.startTime);

        try {
          const item = await tx.cartItem.create({
            data: {
              userId,
              venueId: vId,
              date: it.date,
              court: it.court,
              startTime: it.startTime,
              endTime,
              price,
              expiresAt,
            },
          });

          results.push(item);

        } catch (err) {
          return {
            ok: false,
            reason: "IN_CART",
            conflicts: [
              {
                date: it.date,
                court: it.court,
                startTime: it.startTime,
              },
            ],
          };
        }
      }

      return { ok: true, items: results };
    });

    // Conflict response
    if (!created.ok) {
      return res.status(409).json({
        message: "Slot not available",
        reason: created.reason,
        conflicts: created.conflicts.map((c) => ({
          date: formatDate(c.date),
          court: c.court,
          startTime: c.startTime,
        })),
      });
    }

    // Success
    return res.status(201).json({
      message: "Added to cart",
      expiresAt: expiresAt.toISOString(),
      items: created.items.map((i) => ({
        id: i.id,
        venueId: i.venueId,
        date: formatDate(i.date),
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

