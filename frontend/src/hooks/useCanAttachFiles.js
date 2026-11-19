import useDefaultUserPermissions from "@/hooks/useDefaultUserPermissions";

/**
 * Whether the current user may attach files or images to chats.
 * @returns {boolean}
 */
export default function useCanAttachFiles() {
  return useDefaultUserPermissions().canAttach;
}
