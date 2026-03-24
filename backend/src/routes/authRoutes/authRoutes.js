const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authmiddleware");

const {
	register,
	login,
	logout,
	getMyProfile,
	updateMyProfile,
	changePassword,
} = require("../../controllers/authController/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, getMyProfile);
router.put("/me", auth, updateMyProfile);
router.put("/change-password", auth, changePassword);

module.exports = router;