module.exports = (req, res, next) => {
  const role = req.user?.role;
  const isBooker = role === "BOOKER" || role === "booker";

  if (!isBooker) {
    return res.status(403).json({ message: "Only bookers can access this resource" });
  }

  next();
};

