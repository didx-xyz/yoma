import { useMemo } from "react";
import type { SSICredentialAttribute } from "~/api/models/credential";
import { groupLabelOf } from "~/lib/credentials/attributePresentation";

// ─────────────────────────────────────────────────────────────────────────────
// CredentialAttributes (YOM-1244 / YOM-1283)
//
// Renders the attributes of an issued credential exactly as the wallet API returned them. Every
// label, value, heading and position is API-owned: `nameDisplay`, `valueDisplay`, `itemsDisplay`,
// `group` / `subGroup`, and the order of the collection itself.
//
// Nothing here knows a schema, an opportunity type or a field key, and no value is parsed,
// formatted or interpreted — the API resolves options and lookups to display values, formats dates,
// booleans and numbers, and normalizes both structured and historical Skills before they arrive.
// That is what lets this one view render a generic `Opportunity|Default` credential, a
// type-specific one and a years-old historical one without a branch per case.
// ─────────────────────────────────────────────────────────────────────────────

export interface CredentialAttributeSection {
  /** Stable react key. Position-based, so a repeated heading cannot collide. */
  key: string;
  /** Null for an ungrouped run — it renders without a heading. */
  heading: string | null;
  attributes: SSICredentialAttribute[];
}

/**
 * Splits the wallet's already-ordered attributes into headed sections.
 *
 * Sections are **consecutive runs** of the same group/subGroup label — not a group-by, and not a
 * sort. `SSIAttributePresentationHelper.OrderCredentialAttributes` returns one consolidated
 * collection with core properties and custom fields deliberately interleaved, ordered by
 * Group → SubGroup → SortOrder → display label, so a group's attributes already arrive contiguous.
 *
 * Taking runs rather than re-deriving the order is deliberate: the API owns presentation, and a
 * second client-side ordering is a second source of truth that can silently disagree — JS
 * `localeCompare` and .NET's `OrderBy` do not agree on every string pair. If a response is ever
 * not contiguous we render what it sent, which is the honest failure.
 */
export const toAttributeSections = (
  attributes: SSICredentialAttribute[] | null | undefined,
): CredentialAttributeSection[] => {
  const sections: CredentialAttributeSection[] = [];

  for (const attribute of attributes ?? []) {
    const heading = groupLabelOf(attribute);
    const current = sections.at(-1);

    if (current && current.heading === heading) {
      current.attributes.push(attribute);
      continue;
    }

    sections.push({
      key: `${sections.length}:${heading ?? ""}`,
      heading,
      attributes: [attribute],
    });
  }

  return sections;
};

const CredentialAttributeRow: React.FC<{
  attribute: SSICredentialAttribute;
}> = ({ attribute }) => {
  // `itemsDisplay` is authoritative for complex attributes; `valueDisplay` only flattens them for
  // convenience and an individual value may contain the delimiter, so it is never split. It is
  // still the fallback: a complex attribute issued with no value arrives as an empty item list plus
  // the API's own "n/a", and scalars have no item list at all.
  const items = attribute.itemsDisplay ?? [];

  return (
    <li className="py-4">
      <div className="flex justify-between gap-4 text-sm">
        <p className="font-semibold text-gray-500 md:w-64">
          {attribute.nameDisplay}
        </p>

        {items.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1">
            {items.map((item, index) => (
              <div
                key={`${index}:${item.name}`}
                className="badge bg-green px-2 py-1 text-white"
              >
                {item.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-end text-gray-900">{attribute.valueDisplay}</p>
        )}
      </div>
    </li>
  );
};

export interface CredentialAttributesProps {
  /** The wallet detail response's attributes. Null on wallet *search* items, which carry none. */
  attributes: SSICredentialAttribute[] | null | undefined;
}

export const CredentialAttributes: React.FC<CredentialAttributesProps> = ({
  attributes,
}) => {
  const sections = useMemo(() => toAttributeSections(attributes), [attributes]);

  if (sections.length === 0) return null;

  return (
    <div data-testid="credential-attributes">
      {sections.map((section) => (
        <div key={section.key} className="border-t border-gray-200">
          {section.heading && (
            <h3 className="text-gray-dark pt-4 text-xs font-bold tracking-wide uppercase">
              {section.heading}
            </h3>
          )}
          <ul className="divide-y divide-gray-200">
            {section.attributes.map((attribute) => (
              <CredentialAttributeRow
                key={attribute.name}
                attribute={attribute}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default CredentialAttributes;
