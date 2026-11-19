/**
 * Lets the system administrator stop `default` role users from starting
 * agent sessions. Set `DISABLE_DEFAULT_USER_AGENTS` (any value) to enable it.
 * Explicit `@agent` calls are refused, and workspaces in automatic mode answer
 * these users with regular chat instead of native tool calling.
 * Only applies in multi-user mode; admins and managers are not affected.
 */
const { restrictedForDefaultUser } = require("./defaultUserRestrictions");

const AGENTS_ENV_KEY = "DISABLE_DEFAULT_USER_AGENTS";
const AGENTS_BLOCKED_MESSAGE =
  "Agents are disabled for your account by the system administrator.";

function defaultUserAgentsDisabled() {
  return AGENTS_ENV_KEY in process.env;
}

/**
 * @param {{role: string}|null} user - The requesting user.
 * @param {boolean} multiUserMode - Whether the instance is in multi-user mode.
 * @returns {boolean} true when this user may not use agents.
 */
function agentsBlockedForUser(user = null, multiUserMode = false) {
  return restrictedForDefaultUser(AGENTS_ENV_KEY, user, multiUserMode);
}

/**
 * Same as agentsBlockedForUser, for code paths that do not have
 * response.locals. Only reads the database when the switch is on.
 * @param {{role: string}|null} user - The requesting user.
 * @returns {Promise<boolean>}
 */
async function agentsBlockedForUserLookup(user = null) {
  if (!defaultUserAgentsDisabled()) return false;
  const { SystemSettings } = require("../../models/systemSettings");
  return agentsBlockedForUser(user, await SystemSettings.isMultiUserMode());
}

module.exports = {
  AGENTS_ENV_KEY,
  AGENTS_BLOCKED_MESSAGE,
  defaultUserAgentsDisabled,
  agentsBlockedForUser,
  agentsBlockedForUserLookup,
};
