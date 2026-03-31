const ADMIN_ROLE = "Admin";
const USER_ROLE = "User";

const normalizeRole = (role) => (role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE);

const isAdminRole = (role) => normalizeRole(role) === ADMIN_ROLE;

module.exports = {
  ADMIN_ROLE,
  USER_ROLE,
  normalizeRole,
  isAdminRole,
};
