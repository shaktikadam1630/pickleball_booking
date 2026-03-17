const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authmiddleware");
const requireOwner = require("../../middleware/requireOwner");
    const { createVenue ,getAllVenues, getVenueById} = require("../../controllers/venueController/venueController");

 router.get("/", auth,getAllVenues);
 router.get("/:id", auth, getVenueById);

 router.post("/", auth, requireOwner, createVenue);
// router.get("/owner", auth, requireOwner, getOwnerVenues);
// router.put("/:id", auth, requireOwner, updateVenue);
// router.delete("/:id", auth, requireOwner, deleteVenue);



module.exports = router;

