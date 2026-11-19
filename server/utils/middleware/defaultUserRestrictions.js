/**
 * Shared rule for the deployment-level switches that restrict `default` role
 * users (see defaultUserAttachments.js and defaultUserAgents.js).
 *
 * A switch is on when its environment variable is set to any value. It only
 * applies in multi-user mode, and admins and managers are never restricted.
 */

// Mirrors ROLES.admin and ROLES.manager in ./multiUserProtected. Kept local so
// these modules have no database dependency.
const UNRESTRICTED_ROLES = ["admin", "manager"];

/**
 * @param {string} envKey - The environment variable that turns the switch on.
 * @param {{role: string}|null} user - The requesting user.
 * @param {boolean} multiUserMode - Whether the instance is in multi-user mode.
 * @returns {boolean} true when this user is restricted.
 */
function restrictedForDefaultUser(envKey, user = null, multiUserMode = false) {
  if (!(envKey in process.env) || !multiUserMode) return false;
  return !UNRESTRICTED_ROLES.includes(user?.role);
}

module.exports = { restrictedForDefaultUser };
