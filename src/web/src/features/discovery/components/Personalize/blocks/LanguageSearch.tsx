import React, { useState } from "react";
import type { UserPreferences } from "~/api/models/userPreferences";
import { languageRank, orderOptions } from "../../../lib/optionOrder";
import { useDiscovery } from "../../../state/DiscoveryContext";
import { useLanguageSearch } from "../usePreferenceOptions";
import { Pill } from "./Pill";
import { SearchShell } from "./SearchShell";

/** At most this many search hits at once: "a" alone matches most of the list. */
const MAX_RESULTS = 20;

/**
 * The languages block (BA R11, Jason, 2026-10-21): a search over the FULL `/lookup/language`,
 * the skills block's pattern, where the chips used to offer only the facet list — the languages
 * published opportunities use, four on Stage. With nothing typed, that facet list is still the
 * suggestion row: the ones that find something today, the site's five languages first and the
 * rest A–Z, and all A–Z once "Show all" is open (`lib/optionOrder`, Jason, 2026-10-22). The
 * picks stay multi-select, as they were; they are stored as ids, so the full list labels them.
 */
export const LanguageSearch: React.FC<{
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ draft, onPatch }) => {
  const [text, setText] = useState("");
  const { lookups } = useDiscovery();
  const { all, results } = useLanguageSearch(text, MAX_RESULTS);
  const selected = draft.languages;
  const suggestions = orderOptions(lookups.languages, languageRank);

  const toggle = (id: string): void =>
    onPatch({
      languages: selected.includes(id)
        ? selected.filter((v) => v !== id)
        : [...selected, id],
    });
  const labelOf = (id: string): string =>
    all.find((l) => l.id === id)?.label ??
    lookups.languages.find((l) => l.id === id)?.name ??
    id;
  const pills = (
    offered: { id: string; label: string }[],
  ): React.ReactElement[] => [
    ...selected.map((id) => (
      <Pill key={id} label={labelOf(id)} active onToggle={() => toggle(id)} />
    )),
    ...offered
      .filter((option) => !selected.includes(option.id))
      .map((option) => (
        <Pill
          key={option.id}
          label={option.label}
          active={false}
          onToggle={() => toggle(option.id)}
        />
      )),
  ];
  const named = (languages: { id: string; name: string }[]) =>
    languages.map((l) => ({ id: l.id, label: l.name }));

  return (
    <SearchShell
      text={text}
      onChange={setText}
      placeholder="Search languages…"
      pinned={selected.length}
      pills={pills(text.trim() ? results : named(suggestions.collapsed))}
      expanded={text.trim() ? undefined : pills(named(suggestions.expanded))}
    />
  );
};
