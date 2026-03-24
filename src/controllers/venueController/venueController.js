const prisma = require("../../config/prisma");

const DEFAULT_WEEKDAY_RATE = 500;
const DEFAULT_WEEKEND_RATE = 700;
const MAX_COURTS = 3;

const toIntOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};


exports.createVenue = async (req, res) => {
  try {
    const {
      name,
      address,
      courts,
      phone,
      email,
      description,
    } = req.body;

    if (!name || !address || !courts ||!phone || !email || !description) {
      return res.status(400).json({
        message:
          "name, address, courts,phone, email, and description are required",
      });
    }

    const parsedCourts = toIntOrNull(courts);
    if (!parsedCourts || parsedCourts < 1) {
      return res.status(400).json({ message: "courts must be a number >= 1" });
    }
    if (parsedCourts > MAX_COURTS) {
      return res.status(400).json({ message: `Max ${MAX_COURTS} courts allowed` });
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        courts: parsedCourts,
        weekdayRate: DEFAULT_WEEKDAY_RATE,
        weekendRate: DEFAULT_WEEKEND_RATE,
        phone,
        email,
        description,
        ownerId: req.user.id,
      },
    });

    res.status(201).json({
      message: "Venue created",
      venue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllVenues = async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        courts: true,
        weekdayRate: true,
        weekendRate: true
      }
    });

    res.status(200).json({
      message: "All venues fetched",
      count: venues.length,
      venues
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching venues",
      error: error.message
    });
  }
};

exports.getVenueById = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await prisma.venue.findUnique({
      where: {
        id: Number(id)
      },
      select: {
        id: true,
        name: true,
        address: true,
        courts: true,
        weekdayRate: true,
        weekendRate: true,
        phone: true,
        email: true,
        description: true
      }
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    res.status(200).json({
      message: "Venue details fetched",
      venue
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching venue",
      error: error.message
    });
  }
};


exports.getOwnerVenues = async (req, res) => {
  try {
    const ownerVenues = await prisma.venue.findMany({
      where: { ownerId: req.user.id },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching owner venues",
      error: error.message
    });
  }
};
