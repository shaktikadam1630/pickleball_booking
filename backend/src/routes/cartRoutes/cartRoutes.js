const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authmiddleware");
const requireBooker = require("../../middleware/requireBooker");
const { addToCart, getMyCart, removeCartItem } = require("../../controllers/cartController/cartController");

router.post("/items", auth, requireBooker, addToCart);
router.get("/me", auth, requireBooker, getMyCart);
router.delete("/items/:id", auth, requireBooker, removeCartItem);

module.exports = router;

