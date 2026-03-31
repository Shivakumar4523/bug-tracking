const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { ADMIN_ROLE, USER_ROLE } = require("../utils/roles");

const isBcryptHash = (value = "") => /^\$2[aby]\$\d{2}\$/.test(value);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: [ADMIN_ROLE, USER_ROLE, "Developer", "Tester"],
      default: USER_ROLE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(password) {
  if (!this.password) {
    return false;
  }

  if (isBcryptHash(this.password)) {
    return bcrypt.compare(password, this.password);
  }

  return password === this.password;
};

userSchema.statics.isPasswordHashed = isBcryptHash;

module.exports = mongoose.model("User", userSchema);
