const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authmiddleware");
const requireBooker = require("../../middleware/requireBooker");
const { getVenueAvailability } = require("../../controllers/availabilityController/availabilityController");

router.get("/venues/:venueId", auth, requireBooker, getVenueAvailability);

module.exports = router;

