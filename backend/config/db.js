const mongoose = require("mongoose");
const { getMongoUri } = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(getMongoUri());
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
