const express = require("express");
const {
  getApps,
  updateAppAccess,
  updateAppConnection,
  updateAppInstallation,
} = require("../controllers/appController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getApps);
router.route("/:slug/access").put(protect, adminOnly, updateAppAccess);
router.route("/:slug/connection").put(protect, adminOnly, updateAppConnection);
router.route("/:slug/installation").put(protect, adminOnly, updateAppInstallation);

module.exports = router;
