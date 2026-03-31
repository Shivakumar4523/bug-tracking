const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { normalizeRole, USER_ROLE } = require("../utils/roles");

const buildAuthPayload = (user) => ({
  token: generateToken(user._id),
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
  },
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    res.status(409);
    throw new Error("An account with that email already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: USER_ROLE,
  });

  res.status(201).json(buildAuthPayload(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();

  console.log("[auth] Login request:", {
    email: normalizedEmail || null,
  });

  if (!normalizedEmail || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  console.log("[auth] User found:", Boolean(user));

  const passwordMatches = user ? await user.comparePassword(password) : false;

  console.log("[auth] Password match:", passwordMatches);

  if (!user || !passwordMatches) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  if (!User.isPasswordHashed(user.password)) {
    user.password = password;
    await user.save();
    console.log("[auth] Migrated plaintext password to bcrypt hash:", {
      email: normalizedEmail,
    });
  }

  res.status(200).json(buildAuthPayload(user));
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("name email role createdAt")
    .sort({ name: 1 })
    .lean();

  res.status(200).json(
    users.map((user) => ({
      ...user,
      role: normalizeRole(user.role),
    }))
  );
});

module.exports = {
  register,
  login,
  getUsers,
};
