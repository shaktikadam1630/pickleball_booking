const prisma = require("../../config/prisma");
const redis = require("../../config/redis");
const { makeSlotKey, makeItemKey, makeUserSetKey, releaseSlotIfOwner, loadRedisCartItems } = require("../../utils/redisCart");



exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItemIds } = req.body;

    if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      return res.status(400).json({ message: "cartItemIds[] is required" });
    }

    const cartLoad = await loadRedisCartItems(userId, cartItemIds);
    if (!cartLoad.ok) {
      if (cartLoad.reason === "INVALID_IDS") {
        return res.status(400).json({ message: "Invalid cartItemIds" });
      }
      return res.status(409).json({ message: "Cart items are missing or expired" });
    }

    const txItems = cartLoad.items.map((it) => ({
      id: it.id,
      venueId: Number(it.venueId),
      date: new Date(`${it.date}T00:00:00`),
      court: Number(it.court),
      startTime: it.startTime,
      endTime: it.endTime,
      price: Number(it.price),
    }));

    const result = await prisma.$transaction(async (tx) => {

      // Re-verify availability vs bookings
      const conflicts = await tx.booking.findMany({
        where: {
          OR: txItems.map((it) => ({
            venueId: it.venueId,
            date: it.date,
            court: it.court,
            startTime: it.startTime,
          })),
        },
        select: { venueId: true, date: true, court: true, startTime: true },
      });
      if (conflicts.length) {
        return { ok: false, reason: "ALREADY_BOOKED", conflicts };
      }

      // Create bookings
      const createdBookings = [];
      for (const it of txItems) {
        try {
          const b = await tx.booking.create({
            data: {
              userId,
              venueId: it.venueId,
              date: it.date,
              court: it.court,
              startTime: it.startTime,
              endTime: it.endTime,
              price: it.price,
            },
          });
          createdBookings.push(b);
        } catch (e) {
          // Unique constraint race: another checkout won
          if (e && e.code === "P2002") {
            return {
              ok: false,
              reason: "CONFLICT",
              conflicts: [{ venueId: it.venueId, date: it.date, court: it.court, startTime: it.startTime }],
            };
          }
          throw e;
        }
      }

      return { ok: true, bookings: createdBookings };
    });

    if (!result.ok) {
      switch (result.reason) {
    
        case "MISSING_OR_EXPIRED":
          return res.status(409).json({
            message: "Cart items are missing or expired",
          });
    
        case "ALREADY_BOOKED":
          return res.status(409).json({
            message: "Some slots are already booked",
            conflicts: result.conflicts.map((c) => ({
              venueId: c.venueId,
              date: c.date.toISOString().slice(0, 10),
              court: c.court,
              startTime: c.startTime,
            })),
          });
    
        default:
          return res.status(409).json({
            message: "Checkout failed",
          });
      }
    }

    // Clear Redis cart and slot locks after successful checkout
    const userSetKey = makeUserSetKey(userId);
    for (const it of cartLoad.items) {
      await releaseSlotIfOwner(it);
      await redis.del(makeItemKey(it.id));
      await redis.sRem(userSetKey, it.id);
    }

    const total = result.bookings.reduce((sum, b) => sum + b.price, 0);
    return res.status(201).json({
      message: "Checkout success",
      total,
      bookings: result.bookings.map((b) => ({
        id: b.id,
        venueId: b.venueId,
        date: b.date.toISOString().slice(0, 10),
        court: b.court,
        startTime: b.startTime,
        endTime: b.endTime,
        price: b.price,
        createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        venueId: true,
        date: true,
        court: true,
        startTime: true,
        endTime: true,
        price: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      bookings: bookings.map((b) => ({
        ...b,
        date: b.date.toISOString().slice(0, 10),
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

