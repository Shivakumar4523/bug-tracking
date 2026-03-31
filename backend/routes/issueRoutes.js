const express = require("express");
const {
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
} = require("../controllers/issueController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getIssues).post(protect, createIssue);
router.route("/:id").put(protect, updateIssue).delete(protect, deleteIssue);

module.exports = router;
