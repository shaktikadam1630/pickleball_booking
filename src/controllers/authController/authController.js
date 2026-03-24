const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const VALID_ROLES = ["OWNER", "BOOKER"];


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Use OWNER or BOOKER" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: "User registered successfully", user });

  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Failed to register user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found, please register first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

  
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET
    );


    res.status(200).json({
      token,
    });

  } catch (err) {
    console.error(" Login error:", err.message);
    res.status(500).json({ message: "Failed to login" });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    // No cookies used; client should delete token on its side.
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};