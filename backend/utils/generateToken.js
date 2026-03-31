const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/env");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: "7d",
  });

module.exports = generateToken;
