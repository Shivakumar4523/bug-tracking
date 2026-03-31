const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { resetDefaultUser, DEFAULT_USERS } = require("../utils/defaultUser");

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    await resetDefaultUser();

    console.log("[seed] Default credentials:");
    DEFAULT_USERS.forEach((user) => {
      console.log(`email: ${user.email}`);
      console.log(`password: ${user.password}`);
    });
  } catch (error) {
    console.error(`[seed] Reset failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
