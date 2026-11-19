/**
 * Lets the system administrator stop `default` role users from attaching
 * files or images to chats. Set `DISABLE_DEFAULT_USER_ATTACHMENTS` (any value)
 * to enable it. It only applies in multi-user mode: admins and managers can
 * always attach, and single-user mode is never affected.
 *
 * Like WORKSPACE_DELETION_PROTECTION, this is a deployment-level switch so the
 * instance admin cannot turn it off from the UI.
 */
const { restrictedForDefaultUser } = require("./defaultUserRestrictions");

const ENV_KEY = "DISABLE_DEFAULT_USER_ATTACHMENTS";

const BLOCKED_ERROR =
  "Attaching files is disabled for your account by the system administrator.";

function defaultUserAttachmentsDisabled() {
  return ENV_KEY in process.env;
}

/**
 * @param {{role: string}|null} user - The requesting user.
 * @param {boolean} multiUserMode - Whether the instance is in multi-user mode.
 * @returns {boolean} true when this user may not attach files.
 */
function attachmentsBlockedForUser(user = null, multiUserMode = false) {
  return restrictedForDefaultUser(ENV_KEY, user, multiUserMode);
}

/**
 * Returns the attachments the user is allowed to send, as a new array.
 * @param {any[]} attachments
 * @param {{role: string}|null} user
 * @param {boolean} multiUserMode
 * @returns {any[]}
 */
function allowedAttachments(attachments, user = null, multiUserMode = false) {
  if (!Array.isArray(attachments)) return [];
  if (attachmentsBlockedForUser(user, multiUserMode)) return [];
  return [...attachments];
}

/**
 * Express middleware for routes that only exist to receive attachments.
 * Must run after validatedRequest (or another middleware that sets
 * response.locals.user and response.locals.multiUserMode).
 */
function blockDefaultUserAttachments(_request, response, next) {
  const { user = null, multiUserMode = false } = response.locals ?? {};
  if (!attachmentsBlockedForUser(user, multiUserMode)) return next();
  return response.status(403).json({ success: false, error: BLOCKED_ERROR });
}

module.exports = {
  ENV_KEY,
  defaultUserAttachmentsDisabled,
  attachmentsBlockedForUser,
  allowedAttachments,
  blockDefaultUserAttachments,
};
