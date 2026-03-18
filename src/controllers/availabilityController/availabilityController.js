const prisma = require("../../config/prisma");
const {
  generateStartTimes,
  addOneHour,
  isWeekend,
  parseISODateOnly,
} = require("../../utils/slots");

const COURTS_FIXED = [1, 2, 3];
const OPEN_HOUR = 6;
const CLOSE_HOUR = 23;

exports.getVenueAvailability = async (req, res) => {
  try {
    const venueId = Number.parseInt(req.params.venueId, 10);
    const dateStr = req.query.date;

    if (!Number.isFinite(venueId)) {
      return res.status(400).json({ message: "Invalid venueId" });
    }

    if (!dateStr) {
      return res.status(400).json({ message: "date (YYYY-MM-DD) is required" });
    }

    const day = parseISODateOnly(dateStr);
    if (!day) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, weekdayRate: true, weekendRate: true },
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const now = new Date();

    const isToday =
      now.getFullYear() === day.getFullYear() &&
      now.getMonth() === day.getMonth() &&
      now.getDate() === day.getDate();

    // ✅ Proper date range (IMPORTANT FIX)
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ Cleanup expired cart locks
    await prisma.cartItem.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    // ✅ Fetch bookings + active cart locks
    const [bookings, cartItems] = await Promise.all([
      prisma.booking.findMany({
        where: {
          venueId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { court: true, startTime: true },
      }),
      prisma.cartItem.findMany({
        where: {
          venueId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          expiresAt: { gt: now },
        },
        select: { court: true, startTime: true, userId: true },
      }),
    ]);

    // ✅ Fast lookup
    const bookedSet = new Set(
      bookings.map((b) => `${b.court}_${b.startTime}`)
    );

    const inCartMap = new Map(
      cartItems.map((c) => [`${c.court}_${c.startTime}`, c.userId])
    );

    const starts = generateStartTimes({
      openHour: OPEN_HOUR,
      closeHour: CLOSE_HOUR,
    });

    const weekend = isWeekend(day);
    const price = weekend ? venue.weekendRate : venue.weekdayRate;

    const slots = starts.map((start) => {
      const end = addOneHour(start);

      const cells = COURTS_FIXED.map((court) => {
        const key = `${court}_${start}`;

        // ✅ Priority: BOOKED > CART > TIME > AVAILABLE
        if (bookedSet.has(key)) {
          return { court, state: "BOOKED", price };
        }

        const inCartUserId = inCartMap.get(key);
        if (inCartUserId) {
          return {
            court,
            state:
              inCartUserId === req.user.id
                ? "IN_CART_MINE"
                : "IN_CART",
            price,
          };
        }

        // ✅ Past time check
        if (isToday) {
          const slotStart = new Date(day);
          const hour = Number.parseInt(start.split(":")[0], 10);
          slotStart.setHours(hour, 0, 0, 0);

          if (slotStart.getTime() <= now.getTime()) {
            return { court, state: "UNAVAILABLE", price };
          }
        }

        return { court, state: "AVAILABLE", price };
      });

      return { start, end, cells };
    });

    return res.status(200).json({
      venueId: venue.id,
      date: dateStr,
      courts: COURTS_FIXED,
      slots,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};