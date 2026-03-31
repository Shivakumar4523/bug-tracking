const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const express = require("express");
const { getJwtSecret, getPort } = require("./config/env");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const userRoutes = require("./routes/userRoutes");
const { ensureDefaultUser } = require("./utils/defaultUser");
const app = express();
const PORT = getPort();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "PIRNAV Task Management API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  getJwtSecret();
  await connectDB();
  await ensureDefaultUser();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();
