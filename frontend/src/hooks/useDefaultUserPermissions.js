import { useEffect, useState } from "react";
import System from "@/models/system";
import useUser from "@/hooks/useUser";

// Mirrors the server rule in utils/middleware/defaultUserRestrictions.js
const UNRESTRICTED_ROLES = ["admin", "manager"];

/**
 * What the current user may do in chats, given the deployment-level switches
 * DISABLE_DEFAULT_USER_ATTACHMENTS and DISABLE_DEFAULT_USER_AGENTS.
 * The server enforces these rules too; this hook only hides the UI.
 * While the settings load, `default` users are treated as restricted so the
 * controls do not flash on screen.
 * @returns {{canAttach: boolean, canUseAgents: boolean}}
 */
export default function useDefaultUserPermissions() {
  const { user } = useUser();
  const [switches, setSwitches] = useState(null);

  useEffect(() => {
    let active = true;
    System.keys().then((settings) => {
      if (!active) return;
      setSwitches({
        attachmentsDisabled: settings?.DefaultUserAttachmentsDisabled === true,
        agentsDisabled: settings?.DefaultUserAgentsDisabled === true,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  // No user means single-user mode, where these rules never apply.
  if (!user || UNRESTRICTED_ROLES.includes(user.role))
    return { canAttach: true, canUseAgents: true };
  if (switches === null) return { canAttach: false, canUseAgents: false };
  return {
    canAttach: !switches.attachmentsDisabled,
    canUseAgents: !switches.agentsDisabled,
  };
}
