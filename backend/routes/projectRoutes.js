const express = require("express");
const {
  getProjects,
  createProject,
  deleteProject,
} = require("../controllers/projectController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getProjects).post(protect, adminOnly, createProject);
router.route("/:id").delete(protect, adminOnly, deleteProject);

module.exports = router;
