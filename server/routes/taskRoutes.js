const express = require("express");
const {
  getTasks,
  getMyTasks,
  getTask,
  createTask,
  createIssue,
  updateTask,
  addTaskComment,
  addTaskWorkLog,
  addTaskAttachments,
  deleteTask,
} = require("../controllers/taskController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, adminOnly, getTasks).post(protect, adminOnly, createTask);
router.get("/my", protect, getMyTasks);
router.post("/issues", protect, createIssue);
router.post("/:id/comments", protect, addTaskComment);
router.post("/:id/worklogs", protect, addTaskWorkLog);
router.post("/:id/attachments", protect, addTaskAttachments);
router
  .route("/:id")
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, adminOnly, deleteTask);

module.exports = router;
