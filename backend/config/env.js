const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/pirnav_task_management";
const DEFAULT_PORT = 5000;

const getPort = () => Number(process.env.PORT || DEFAULT_PORT);

const getMongoUri = () => process.env.MONGO_URI || DEFAULT_MONGO_URI;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required. Add it to server/.env.");
  }

  return process.env.JWT_SECRET;
};

module.exports = {
  getPort,
  getMongoUri,
  getJwtSecret,
};
