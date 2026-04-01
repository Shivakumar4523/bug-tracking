const express = require("express");
const {
  getIssues,
  createIssue,
  importIssues,
  updateIssue,
  deleteIssue,
} = require("../controllers/issueController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/import", protect, adminOnly, importIssues);
router.route("/").get(protect, getIssues).post(protect, createIssue);
router.route("/:id").put(protect, updateIssue).delete(protect, deleteIssue);

module.exports = router;
