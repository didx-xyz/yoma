import { useAtomValue } from "jotai";
import {
  activeRoleViewAtom,
  currentOrganisationIdAtom,
  RoleView,
} from "~/lib/store";

export const useHomeLink = () => {
  const activeRoleView = useAtomValue(activeRoleViewAtom);
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom);

  const href =
    activeRoleView === RoleView.Admin
      ? "/admin"
      : activeRoleView === RoleView.OrgAdmin && currentOrganisationId
      ? `/organisations/${currentOrganisationId}`
      : "/";

  return href;
};
