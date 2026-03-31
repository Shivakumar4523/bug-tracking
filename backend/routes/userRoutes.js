const express = require("express");
const {
  getUsers,
  createUser,
  bulkImportUsers,
  deleteUser,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/bulk", protect, adminOnly, bulkImportUsers);

router
  .route("/")
  .get(protect, adminOnly, getUsers)
  .post(protect, adminOnly, createUser);

router.route("/:id").delete(protect, adminOnly, deleteUser);

module.exports = router;
