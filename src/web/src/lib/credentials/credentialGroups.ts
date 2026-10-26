import type { SSICredentialInfo } from "~/api/models/credential";
import {
  OTHER_TYPE,
  YOID_TYPE,
  credentialTypeKey,
  credentialTypeLabel,
} from "~/lib/typeColours";

export interface CredentialGroup {
  /** The palette key: `YoID` or an Opportunity Type name (untyped credentials are `Other`). */
  key: string;
  /** The group's name on its chip and section heading ("Other opportunities" for Other). */
  label: string;
  /** The type's own label, for the card chip and the modal ("Other"). */
  typeLabel: string;
  credentials: SSICredentialInfo[];
}

/**
 * Groups wallet credentials by credential type: YoID first, then the Opportunity Types in the
 * lookup's order (untyped credentials sit in Other), then any type the lookup does not know (in
 * the order met). Each group keeps the API's own order.
 */
export const toCredentialGroups = (
  credentials: SSICredentialInfo[],
  types: { name: string; displayName: string }[],
): CredentialGroup[] => {
  const byKey = new Map<string, SSICredentialInfo[]>();
  for (const credential of credentials) {
    const key = credentialTypeKey(credential);
    const group = byKey.get(key);
    if (group) group.push(credential);
    else byKey.set(key, [credential]);
  }

  const rank = (key: string): number => {
    if (key === YOID_TYPE) return -1;
    const index = types.findIndex((t) => t.name === key);
    return index === -1 ? types.length : index;
  };

  // `sort` is stable, so unknown types keep the order they were met in.
  return [...byKey.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([key, items]) => {
      const typeLabel = credentialTypeLabel(types, key);
      return {
        key,
        label: key === OTHER_TYPE ? "Other opportunities" : typeLabel,
        typeLabel,
        credentials: items,
      };
    });
};
