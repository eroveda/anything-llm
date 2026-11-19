import { useEffect, useState } from "react";
import System from "@/models/system";
import useUser from "@/hooks/useUser";

// Mirrors the server rule in utils/middleware/defaultUserAttachments.js
const ROLES_ALLOWED_TO_ATTACH = ["admin", "manager"];

/**
 * Whether the current user may attach files or images to chats.
 * The server enforces this rule too; this hook only hides the UI.
 * While the setting is loading, `default` users are treated as blocked so the
 * attach button does not flash on screen.
 * @returns {boolean}
 */
export default function useCanAttachFiles() {
  const { user } = useUser();
  const [disabledForDefaultUsers, setDisabledForDefaultUsers] = useState(null);

  useEffect(() => {
    let active = true;
    System.keys().then((settings) => {
      if (active)
        setDisabledForDefaultUsers(
          settings?.DefaultUserAttachmentsDisabled === true
        );
    });
    return () => {
      active = false;
    };
  }, []);

  // No user means single-user mode, where this rule never applies.
  if (!user) return true;
  if (ROLES_ALLOWED_TO_ATTACH.includes(user.role)) return true;
  return disabledForDefaultUsers === false;
}
