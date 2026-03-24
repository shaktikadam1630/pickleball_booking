const prisma = require("../../config/prisma");
const {
  generateStartTimes,
  addOneHour,
  isWeekend,
  parseISODateOnly,
} = require("../../utils/slots");

const OPEN_HOUR = 6;
const CLOSE_HOUR = 23;

const isMissingTableError = (err) => {
  if (!err) return false;
  if (err.code === "P2021") return true;
  return String(err.message || "").toLowerCase().includes("does not exist");
};

const hasCartItemModel = () => {
  return Boolean(prisma?.cartItem && typeof prisma.cartItem.findMany === "function");
};

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
      select: { id: true, courts: true, weekdayRate: true, weekendRate: true },
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const isToday =
      now.getFullYear() === day.getFullYear() &&
      now.getMonth() === day.getMonth() &&
      now.getDate() === day.getDate();
    const isPastDate = day.getTime() < startOfToday.getTime();

    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        venueId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { court: true, startTime: true },
    });

    
    let cartItems = [];
    if (hasCartItemModel()) {
      try {
        await prisma.cartItem.deleteMany({
          where: { expiresAt: { lte: now } },
        });

        cartItems = await prisma.cartItem.findMany({
          where: {
            venueId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
            expiresAt: { gt: now },
          },
          select: { court: true, startTime: true, userId: true },
        });
      } catch (err) {
        if (!isMissingTableError(err)) {
          throw err;
        }
      }
    }

    const bookedSet = new Set(bookings.map((b) => `${b.court}_${b.startTime}`));
    const inCartMap = new Map(cartItems.map((c) => [`${c.court}_${c.startTime}`, c.userId]));

    const starts = generateStartTimes({
      openHour: OPEN_HOUR,
      closeHour: CLOSE_HOUR,
    });

    const courts = Array.from({ length: Math.max(1, Number(venue.courts) || 1) }, (_, i) => i + 1);

    const weekend = isWeekend(day);
    const price = weekend ? venue.weekendRate : venue.weekdayRate;

    const slots = starts.map((start) => {
      const end = addOneHour(start);

      const cells = courts.map((court) => {
        if (isPastDate) {
          return { court, state: "UNAVAILABLE", price };
        }

        const key = `${court}_${start}`;

        if (bookedSet.has(key)) {
          return { court, state: "BOOKED", price };
        }

        const inCartUserId = inCartMap.get(key);
        if (inCartUserId) {
          return {
            court,
            state: inCartUserId === req.user.id ? "IN_CART_MINE" : "IN_CART",
            price,
          };
        }

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
      courts,
      slots,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
