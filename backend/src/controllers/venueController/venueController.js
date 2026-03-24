const prisma = require("../../config/prisma");

const DEFAULT_WEEKDAY_RATE = 500;
const DEFAULT_WEEKEND_RATE = 700;
const MAX_COURTS = 3;

const toIntOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const photoUrlsFromFiles = (req) => {
  const files = req.files || [];
  return files.map((file) => `/uploads/venues/${file.filename}`);
};

const toPhotoList = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : []);


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
        photos: photoUrlsFromFiles(req),
        phone,
        email,
        description,
        ownerId: req.user.id,
      },
    });

    res.status(201).json({
      message: "Venue created",
      venue,
      photos: venue.photos || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllVenues = async (req, res) => {
  try {
    const role = req.user?.role;
    const isOwner = role === "OWNER" || role === "owner";

    const venues = await prisma.venue.findMany({
      where: isOwner ? { ownerId: req.user.id } : undefined,
      select: {
        id: true,
        name: true,
        address: true,
        courts: true,
        weekdayRate: true,
        weekendRate: true,
        photos: true,
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
        photos: true,
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
      select: {
        id: true,
        name: true,
        address: true,
        courts: true,
        weekdayRate: true,
        weekendRate: true,
        photos: true,
        phone: true,
        email: true,
        description: true,
      },
    });

    return res.status(200).json({
      message: "Owner venues fetched",
      count: ownerVenues.length,
      venues: ownerVenues,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching owner venues",
      error: error.message
    });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const venueId = Number(req.params.id);

    if (!Number.isInteger(venueId) || venueId < 1) {
      return res.status(400).json({ message: "Invalid venue id" });
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        ownerId: true,
        photos: true,
      },
    });

    if (!existingVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    if (existingVenue.ownerId !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own venue" });
    }

    const { name, address, courts, phone, email, description, thumbnailIndex } = req.body;
    const data = {};

    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof address === "string" && address.trim()) data.address = address.trim();
    if (typeof phone === "string" && phone.trim()) data.phone = phone.trim();
    if (typeof email === "string" && email.trim()) data.email = email.trim();
    if (typeof description === "string" && description.trim()) data.description = description.trim();

    if (courts !== undefined && courts !== null && courts !== "") {
      const parsedCourts = toIntOrNull(courts);
      if (!parsedCourts || parsedCourts < 1) {
        return res.status(400).json({ message: "courts must be a number >= 1" });
      }
      if (parsedCourts > MAX_COURTS) {
        return res.status(400).json({ message: `Max ${MAX_COURTS} courts allowed` });
      }
      data.courts = parsedCourts;
    }

    if (thumbnailIndex !== undefined && thumbnailIndex !== null && thumbnailIndex !== "") {
      const photos = toPhotoList(existingVenue.photos);
      const parsedThumbnailIndex = toIntOrNull(thumbnailIndex);

      if (!photos.length) {
        return res.status(400).json({ message: "No photos available to set thumbnail" });
      }

      if (parsedThumbnailIndex === null || parsedThumbnailIndex < 0 || parsedThumbnailIndex >= photos.length) {
        return res.status(400).json({ message: "Invalid thumbnail index" });
      }

      const [thumbnail] = photos.splice(parsedThumbnailIndex, 1);
      data.photos = [thumbnail, ...photos];
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const venue = await prisma.venue.update({
      where: { id: venueId },
      data,
      select: {
        id: true,
        name: true,
        address: true,
        courts: true,
        weekdayRate: true,
        weekendRate: true,
        photos: true,
        phone: true,
        email: true,
        description: true,
      },
    });

    return res.status(200).json({
      message: "Venue updated",
      venue,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating venue",
      error: error.message,
    });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    const venueId = Number(req.params.id);

    if (!Number.isInteger(venueId) || venueId < 1) {
      return res.status(400).json({ message: "Invalid venue id" });
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, ownerId: true },
    });

    if (!existingVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    if (existingVenue.ownerId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own venue" });
    }

    await prisma.venue.delete({ where: { id: venueId } });

    return res.status(200).json({ message: "Venue deleted" });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting venue",
      error: error.message,
    });
  }
};
