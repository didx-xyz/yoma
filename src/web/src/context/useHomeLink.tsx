import { useAtomValue } from "jotai";
import {
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  RoleView,
} from "~/lib/store";

export const useHomeLink = () => {
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom);

  const href =
    activeRoleView === RoleView.Admin
      ? "/admin"
      : activeRoleView === RoleView.OrgAdmin && currentOrganisationId
        ? `/organisations/${currentOrganisationId}`
        : "/";

  return href;
};
