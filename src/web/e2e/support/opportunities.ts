import type { ApiClient } from "./api";
import { ORGANISATIONS } from "../seed";

/**
 * Create a minimal, valid, Active opportunity of a type through the API — for tests that need
 * one to act on without driving the eight-step wizard. No verification, no reward, so it needs
 * neither a credential schema nor a ZLTO pool. Archive it afterwards with
 * `api.patch(\`/opportunity/${id}/Deleted\`)` (the API has no DELETE). `url` is the partner link
 * behind "Go to opportunity" (none by default).
 */
export async function createOpportunity(
  api: ApiClient,
  type: string,
  title: string,
  { url = null }: { url?: string | null } = {},
): Promise<string> {
  const [types, categories, countries, languages, intervals, skills] =
    await Promise.all([
      api.get("/opportunity/type") as Promise<Lookup[]>,
      api.get("/opportunity/category") as Promise<Lookup[]>,
      api.get("/lookup/country") as Promise<Lookup[]>,
      api.get("/lookup/language") as Promise<Lookup[]>,
      api.get("/lookup/timeinterval") as Promise<Lookup[]>,
      api.get("/lookup/skill?pageNumber=1&pageSize=1") as Promise<{
        items: Lookup[];
      }>,
    ]);
  const skill = skills.items[0];
  if (!skill)
    throw new Error(
      "createOpportunity: the seed has no skills (GET /lookup/skill returned none)",
    );
  const opportunityType = types.find((t) => t.name === type);
  if (!opportunityType)
    throw new Error(
      `createOpportunity: unknown opportunity type "${type}" — seed has: ${types.map((t) => t.name).join(", ")}`,
    );
  const res = (await api.post("/opportunity", {
    id: null,
    title,
    description: "Created by the e2e suite.",
    summary: "e2e",
    typeId: opportunityType.id,
    organizationId: ORGANISATIONS.yoma.id,
    instructions: null,
    uRL: url,
    zltoReward: null,
    zltoRewardPool: null,
    rewardType: "None",
    incentivized: type === "Entrepreneurship" ? null : false,
    partnerIncentiveAmount: null,
    partnerIncentiveCurrency: null,
    verificationEnabled: false,
    verificationMethod: null,
    verificationTypes: null,
    commitmentIntervalId: intervals[0]!.id,
    commitmentIntervalCount: 1, // required by the API for every type (the UI relaxes it)
    participantLimit: null,
    keywords: ["e2e"],
    dateStart: isoDate(-1),
    dateEnd: type === "Job" ? isoDate(30) : null,
    credentialIssuanceEnabled: false,
    ssiSchemaName: null,
    engagementTypeId: null,
    provider: null,
    providerURL: null,
    providerLogoURL: null,
    providerCountryId: null,
    accessibilitySupport: null,
    accommodationOtherDescription: null,
    ageFrom: null,
    ageTo: null,
    accommodations: null,
    targetedGroups: null,
    sustainableDevelopmentGoals: null,
    categories: [categories[0]!.id],
    countries: [
      {
        countryId: countries[0]!.id,
        region: null,
        city: null,
        coordinates: null,
      },
    ],
    languages: [languages[0]!.id],
    skills: [skill.id],
    postAsActive: true,
    shareWithPartners: false,
    hidden: false,
    externalId: null,
    customFields: await requiredCustomFields(api, type, skill.id),
  })) as { id: string };
  return res.id;
}

/**
 * A valid value for every required custom field of a type, from the live definitions: inline
 * options submit their `key`; lookup-typed fields (Education, Skill, …) submit a lookup id.
 */
export async function requiredCustomFields(
  api: ApiClient,
  type: string,
  skillId: string,
) {
  const defs = (await api.get(
    `/opportunity/custom/field/definition?types=${type}`,
  )) as Definition[];
  const lookupId = async (lookup: string) => {
    if (lookup === "Skill") return skillId;
    const [first] = (await api.get(
      `/lookup/${lookup.toLowerCase()}`,
    )) as Lookup[];
    return first!.id;
  };
  const fields = [];
  for (const d of defs.filter((x) => x.isRequired)) {
    if (d.dataType === "Boolean") fields.push({ key: d.key, value: "false" });
    else if (d.lookupType)
      fields.push({ key: d.key, values: [await lookupId(d.lookupType)] });
    else if (d.options?.[0])
      fields.push({ key: d.key, values: [d.options[0].key] });
    else fields.push({ key: d.key, value: "1" });
  }
  return fields;
}

export function isoDate(daysFromToday: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

export interface Lookup {
  id: string;
  name: string;
}

export interface Definition {
  key: string;
  dataType: string;
  isRequired: boolean;
  supportsMultiple: boolean | null;
  lookupType: string | null;
  options: { id: string; key: string; name: string }[] | null;
}
