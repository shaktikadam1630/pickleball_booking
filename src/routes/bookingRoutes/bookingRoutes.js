const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authmiddleware");
const requireBooker = require("../../middleware/requireBooker");
const { checkout, getMyBookings } = require("../../controllers/bookingController/bookingController");

router.post("/checkout", auth, requireBooker, checkout);
router.get("/me", auth, requireBooker, getMyBookings);

module.exports = router;

