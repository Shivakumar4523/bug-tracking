const express = require("express");
const { getTeams, createTeam } = require("../controllers/teamController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getTeams).post(protect, adminOnly, createTeam);

module.exports = router;
