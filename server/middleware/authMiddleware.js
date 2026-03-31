const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/env");
const User = require("../models/User");
const { isAdminRole, normalizeRole } = require("../utils/roles");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token invalid");
  }

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user no longer exists");
  }

  user.role = normalizeRole(user.role);
  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (!isAdminRole(req.user?.role)) {
    res.status(403);
    throw new Error("Admin access is required");
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
};
