const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const express = require("express");
const appRoutes = require("./routes/appRoutes");
const { getJwtSecret, getPort } = require("./config/env");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");
const issueRoutes = require("./routes/issueRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const userRoutes = require("./routes/userRoutes");
const { ensureDefaultUser } = require("./utils/defaultUser");
const app = express();
const PORT = getPort();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "PIRNAV Task Management API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/apps", appRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  getJwtSecret();
  await connectDB();
  await ensureDefaultUser();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the existing backend or change PORT in backend/.env.`
      );
      process.exit(1);
    }

    throw error;
  });
};

startServer().catch((error) => {
  console.error(error.message || "Unable to start server.");
  process.exit(1);
});
