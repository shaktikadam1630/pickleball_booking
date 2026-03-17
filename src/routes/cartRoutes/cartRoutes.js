const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authmiddleware");
const requireBooker = require("../../middleware/requireBooker");
const { addToCart, getMyCart, removeCartItem } = require("../../controllers/cartController/cartController");

router.post("/cart/items", auth, requireBooker, addToCart);
router.get("/me/cart", auth, requireBooker, getMyCart);
router.delete("/cart/items/:id", auth, requireBooker, removeCartItem);

module.exports = router;

