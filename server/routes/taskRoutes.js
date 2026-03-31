const express = require("express");
const {
  getTasks,
  getMyTasks,
  createTask,
  createIssue,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, adminOnly, getTasks).post(protect, adminOnly, createTask);
router.get("/my", protect, getMyTasks);
router.post("/issues", protect, createIssue);
router
  .route("/:id")
  .put(protect, updateTask)
  .delete(protect, adminOnly, deleteTask);

module.exports = router;
