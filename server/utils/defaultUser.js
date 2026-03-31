const User = require("../models/User");
const { ADMIN_ROLE, USER_ROLE } = require("./roles");

const DEFAULT_USERS = [
  {
    name: "PIRNAV Admin",
    email: "admin@example.com",
    password: "admin123",
    role: ADMIN_ROLE,
  },
  {
    name: "PIRNAV User",
    email: "user@example.com",
    password: "user123",
    role: USER_ROLE,
  },
];

const ensureDefaultUser = async () => {
  for (const defaultUser of DEFAULT_USERS) {
    const existingUser = await User.findOne({
      email: defaultUser.email,
    }).select("+password");

    if (!existingUser) {
      await User.create(defaultUser);
      console.log(`[seed] Default user created: ${defaultUser.email}`);
      continue;
    }

    const passwordMatches = await existingUser.comparePassword(
      defaultUser.password
    );

    let updated = false;

    if (existingUser.name !== defaultUser.name) {
      existingUser.name = defaultUser.name;
      updated = true;
    }

    if (existingUser.role !== defaultUser.role) {
      existingUser.role = defaultUser.role;
      updated = true;
    }

    if (!passwordMatches) {
      existingUser.password = defaultUser.password;
      updated = true;
    }

    if (updated) {
      await existingUser.save();
      console.log(`[seed] Default user refreshed and ready: ${defaultUser.email}`);
      continue;
    }

    console.log(`[seed] Default user already ready: ${defaultUser.email}`);
  }
};

const resetDefaultUser = async () => {
  await User.deleteMany({
    email: {
      $in: DEFAULT_USERS.map((user) => user.email),
    },
  });

  const users = await User.create(DEFAULT_USERS);

  DEFAULT_USERS.forEach((user) => {
    console.log(`[seed] Default user reset: ${user.email}`);
  });

  return users;
};

module.exports = {
  DEFAULT_USERS,
  ensureDefaultUser,
  resetDefaultUser,
};
