const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authmiddleware");
const requireOwner = require("../../middleware/requireOwner");
const uploadVenuePhotos = require("../../middleware/uploadVenuePhotos");
const {
    createVenue,
    getAllVenues,
    getVenueById,
    updateVenue,
    deleteVenue,
} = require("../../controllers/venueController/venueController");

router.get("/", auth, getAllVenues);
router.get("/:id", auth, getVenueById);

router.post("/", auth, requireOwner, uploadVenuePhotos, createVenue);
router.put("/:id", auth, requireOwner, updateVenue);
router.delete("/:id", auth, requireOwner, deleteVenue);



module.exports = router;

