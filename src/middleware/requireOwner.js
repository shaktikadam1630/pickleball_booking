module.exports = (req, res, next) => {
  const role = req.user?.role;

  // Your Prisma enum uses lowercase (owner/booker), but some code uses uppercase (OWNER/BOOKER).
  const isOwner = role === "owner" || role === "OWNER";

  if (!isOwner) {
    return res.status(403).json({ message: "Only owners can access this resource" });
  }

  next();
};

