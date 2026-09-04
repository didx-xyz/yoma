import type { GetServerSidePropsContext } from "next";
import {
  ArtifactType,
  SchemaType,
  type SSISchema,
  type SSISchemaEntity,
  type SSISchemaEntityCustomField,
  type SSISchemaEntityProperty,
  type SSISchemaRequestCreate,
  type SSISchemaRequestUpdate,
  type SSISchemaType,
} from "~/api/models/credential";

/**
 * ⚠️⚠️ TEMPORARY DEV AID — DELETE THIS FILE BEFORE MERGING. ⚠️⚠️
 *
 * Canned schema-management payloads so YOM-1281 can be built and driven in the browser without a
 * single request reaching the credential provider. Creating or updating a provider schema is not
 * reversible — every version is published — which is why the mutations are mocked too, not just
 * the reads.
 *
 * To go live, flip ONE line: `SCHEMA_ADMIN_MOCK_ENABLED` in
 * `~/api/services/credentialSchemaAdmin.ts`. Nothing else imports this module.
 *
 * The fixtures are transcribed from the API branch, not from the ticket:
 *   - static entities/properties: migration `20240216114120_ApplicationDb_Initial_Seeding`, less
 *     `20260806191303_..._Seeding_RemoveRewardYoma` (attribute names rebuilt the way
 *     `SSISchemaEntityService.ReflectEntityTypeInformation` does: `{DeclaringType}_{Property}`,
 *     so `Skills.Name` → `Opportunity_Skills`)
 *   - static presentation metadata: `20260814101500_..._Seeding_SchemaEntityProperties`
 *   - custom fields: migration
 *     `20260806191303_ApplicationDb_Custom_Fields_Treasury_Payout_Seeding_CustomFields`
 *     (attribute names `{EntityType}_{key}`, per `SSISchemaEntityService.ToCustomField`)
 *   - ordering: `SSIAttributePresentationHelper`
 *   - response shapes: `SSISchema`, `SSISchemaEntity`, `SSISchemaEntityCustomField`
 *
 * Enums are emitted as PascalCase strings by the API's StrictStringEnumConverter, so the fixtures
 * use strings ("Opportunity", "JWS", "ACR", "String", …) rather than numbers.
 */

const LATENCY_MS = 150;

const sleep = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

// ---------------------------------------------------------------------------
// Schema types (GET /ssi/schema/types)
// ---------------------------------------------------------------------------

const SCHEMA_TYPE_OPPORTUNITY_ID = "7818b5c3-3d57-4264-b90b-df53eaa9f749";
const SCHEMA_TYPE_YOID_ID = "ec978798-aac0-4577-846e-1b5b2e6663ce";

const SCHEMA_TYPES: SSISchemaType[] = [
  {
    id: SCHEMA_TYPE_OPPORTUNITY_ID,
    type: "Opportunity",
    name: "Opportunity",
    description: "Opportunity",
    supportMultiple: true,
  },
  {
    id: SCHEMA_TYPE_YOID_ID,
    type: "YoID",
    name: "YoID",
    description: "Yoma Member (YoID)",
    supportMultiple: false,
  },
];

const TYPES_OPPORTUNITY = [SCHEMA_TYPES[0]!];
const TYPES_YOID = [SCHEMA_TYPES[1]!];

// ---------------------------------------------------------------------------
// Static entity properties
// ---------------------------------------------------------------------------

const ENTITY_ID_OPPORTUNITY = "e8ae5b9b-11ae-4ecb-8f6c-020a3d6a5c3d";
const ENTITY_ID_MYOPPORTUNITY = "ca11d9d0-39f6-46d8-a0d3-350ec41402f5";
const ENTITY_ID_USER = "ac5c06ac-6ead-4b47-8e11-4b182daac8cc";
const ENTITY_ID_ORGANIZATION = "b8c64b98-61c2-43f8-a583-7a7927340333";

/**
 * `group` / `sortOrder` are developer-controlled presentation metadata seeded by
 * `20260814101500_..._Seeding_SchemaEntityProperties`. System properties carry none — they render
 * in the credential's fixed header. `subGroup` exists in the contract but nothing seeds one yet.
 */
const property = (
  id: string,
  nameDisplay: string,
  description: string,
  attributeName: string,
  typeName: string,
  system: boolean,
  required: boolean,
  group: string | null = null,
  sortOrder: number | null = null,
): SSISchemaEntityProperty => ({
  id,
  nameDisplay,
  description,
  attributeName,
  typeName,
  system,
  required,
  group,
  subGroup: null,
  sortOrder,
});

// Ordered by SSIAttributePresentationHelper.OrderProperties: system first, then configured groups
// before ungrouped, then Group -> SubGroup -> SortOrder -> display label -> attribute name.
const PROPERTIES_OPPORTUNITY: SSISchemaEntityProperty[] = [
  property(
    "79e64f8f-5b1e-4de2-88d4-2148e30cc49c",
    "Organization Logo Url",
    "Organization Logo Url",
    "Opportunity_OrganizationLogoURL",
    "String",
    true,
    false,
  ),
  property(
    "e763c235-f1b8-4d12-b60f-117af7948355",
    "Organization Name",
    "Organization Name",
    "Opportunity_OrganizationName",
    "String",
    true,
    true,
  ),
  property(
    "7da9b94b-5158-4a62-9993-a6fad6e5ea23",
    "Title",
    "Title",
    "Opportunity_Title",
    "String",
    true,
    true,
  ),
  property(
    "755b1f54-1365-4d2f-af29-8aec57cc7b4c",
    "Type",
    "i.e. Learning",
    "Opportunity_Type",
    "String",
    false,
    true,
    "Opportunity Details",
    1,
  ),
  property(
    "ff423d0c-2e91-48a6-9245-28eef6e96b01",
    "Difficulty",
    "i.e. Intermediate",
    "Opportunity_Difficulty",
    "String",
    false,
    true,
    "Opportunity Details",
    2,
  ),
  property(
    "5fad171f-3e8c-4db5-86fa-c4029fe29f22",
    "Summary",
    "Summary",
    "Opportunity_Summary",
    "String",
    false,
    false,
    "Opportunity Details",
    3,
  ),
  property(
    "f4baa24b-463f-4b74-ba81-7cc5dcbe8df5",
    "Skills",
    "Skills",
    "Opportunity_Skills",
    "List<Skill>",
    false,
    false,
    "Opportunity Details",
    4,
  ),
];

// NB: the legacy `MyOpportunity_YomaReward` property was deleted by
// `20260806191303_..._Seeding_RemoveRewardYoma` and is intentionally absent.
const PROPERTIES_MYOPPORTUNITY: SSISchemaEntityProperty[] = [
  property(
    "8ad09b9c-61a1-4a68-b401-e926dd84e9dc",
    "Completion Date",
    "Completion Date",
    "MyOpportunity_DateCompleted",
    "DateTimeOffset",
    false,
    false,
    "Completion Details",
    1,
  ),
  property(
    "682974e4-7aab-4060-8a27-426f91c02add",
    "Zlto Reward",
    "Zlto Reward",
    "MyOpportunity_ZltoReward",
    "Decimal",
    false,
    false,
    "Completion Details",
    2,
  ),
  property(
    "a3e3ff94-67e0-4a03-983f-8d3d5df5b56a",
    "User Display Name",
    "User Display Name",
    "MyOpportunity_UserDisplayName",
    "String",
    false,
    true,
    "Youth Details",
    1,
  ),
  property(
    "cb8de9bf-4c7c-429e-9b99-d92c9c6d79a0",
    "User Date of Birth",
    "User Date of Birth",
    "MyOpportunity_UserDateOfBirth",
    "DateTimeOffset",
    false,
    false,
    "Youth Details",
    2,
  ),
];

const PROPERTIES_USER: SSISchemaEntityProperty[] = [
  property(
    "26ea32e2-5913-44b7-835f-12f0882685c4",
    "Display Name",
    "Display Name",
    "User_DisplayName",
    "String",
    true,
    true,
  ),
  property(
    "32447353-1698-467c-8b5d-ad85e89235b0",
    "Email",
    "Email",
    "User_Email",
    "String",
    false,
    true,
    "Contact Details",
    1,
  ),
  property(
    "64d4cbeb-3692-4e39-aaa7-b704f46afb6d",
    "Phone Number",
    "Phone Number",
    "User_PhoneNumber",
    "String",
    false,
    false,
    "Contact Details",
    2,
  ),
  property(
    "d26b85e6-223e-48b6-a12f-6c2d0136dd2f",
    "First Name",
    "First Name",
    "User_FirstName",
    "String",
    false,
    true,
    "Personal Details",
    1,
  ),
  property(
    "f7d89c98-0447-42df-8a2d-a369b9fbaeba",
    "Surname",
    "Surname",
    "User_Surname",
    "String",
    false,
    true,
    "Personal Details",
    2,
  ),
  property(
    "d56808d2-f3db-4d82-aa5c-1fba04c8e3bd",
    "Date of Birth",
    "Date of Birth",
    "User_DateOfBirth",
    "DateTimeOffset",
    false,
    false,
    "Personal Details",
    3,
  ),
  property(
    "c26d9276-5f94-4bb3-94ba-67c435025708",
    "Gender",
    "Gender",
    "User_Gender",
    "String",
    false,
    false,
    "Personal Details",
    4,
  ),
  property(
    "b88a8825-fc5a-4000-93fe-9406a7898c58",
    "Education",
    "Education",
    "User_Education",
    "String",
    false,
    false,
    "Personal Details",
    5,
  ),
  property(
    "b14c9c34-4c89-4dae-88ab-9d667be2ef7f",
    "Country",
    "Country",
    "User_Country",
    "String",
    false,
    false,
    "Personal Details",
    6,
  ),
];

const PROPERTIES_ORGANIZATION: SSISchemaEntityProperty[] = [
  property(
    "084b3027-af8a-4329-8221-c6437cfbcd61",
    "Logo Url",
    "Yoma (Youth Agency Marketplace) Logo Url",
    "Organization_LogoURL",
    "String",
    true,
    false,
  ),
  property(
    "f815a540-8c83-41de-b67c-f327a4b92af0",
    "Name",
    "Yoma (Youth Agency Marketplace)",
    "Organization_Name",
    "String",
    true,
    true,
  ),
];

// ---------------------------------------------------------------------------
// Custom-field definitions
// ---------------------------------------------------------------------------

type CustomFieldSeed = {
  id: string;
  entity: "Opportunity" | "MyOpportunity";
  typeContext: string | null;
  key: string;
  nameDisplay: string;
  group: string;
  subGroup: string;
  dataType:
    | "String"
    | "Integer"
    | "Decimal"
    | "Boolean"
    | "DateTime"
    | "Option";
  supportsMultiple?: boolean | null;
  sortOrder: number;
  required?: boolean;
  isActive?: boolean;
  isSystem?: boolean;
  isSchemaMapped?: boolean;
};

const TEMP_DESCRIPTION =
  "Temporary sample definition pending the BA-approved field list (YOM-1264).";

/** Mirrors SSISchemaEntityService.ToTypeName. */
const toTypeName = (seed: CustomFieldSeed): string => {
  switch (seed.dataType) {
    case "String":
      return "String";
    case "Integer":
      return "Int32";
    case "Decimal":
      return "Decimal";
    case "Boolean":
      return "Boolean";
    case "DateTime":
      return "DateTimeOffset";
    case "Option":
      return seed.supportsMultiple === true ? "List<String>" : "String";
  }
};

const toCustomField = (seed: CustomFieldSeed): SSISchemaEntityCustomField => ({
  id: seed.id,
  key: seed.key,
  nameDisplay: seed.nameDisplay,
  description: TEMP_DESCRIPTION,
  attributeName: `${seed.entity}_${seed.key}`,
  typeName: toTypeName(seed),
  typeContext: seed.typeContext,
  dataType: seed.dataType,
  lookupType: null,
  supportsMultiple: seed.supportsMultiple ?? null,
  group: seed.group,
  subGroup: seed.subGroup,
  sortOrder: seed.sortOrder,
  required: seed.required ?? false,
  isActive: seed.isActive ?? true,
  isSystem: seed.isSystem ?? false,
  isSchemaMapped: seed.isSchemaMapped ?? false,
  get isProtected() {
    return (seed.isSystem ?? false) || (seed.isSchemaMapped ?? false);
  },
});

const CUSTOM_FIELD_SEEDS: CustomFieldSeed[] = [
  // Opportunity — generic
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000001", entity: "Opportunity", typeContext: null, key: "sampleAudienceDescription", nameDisplay: "[Sample] Audience Description", group: "[Sample] General", subGroup: "Basics", dataType: "String", sortOrder: 10 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000002", entity: "Opportunity", typeContext: null, key: "sampleAvailablePlaces", nameDisplay: "[Sample] Available Places", group: "[Sample] General", subGroup: "Capacity", dataType: "Integer", sortOrder: 20 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000003", entity: "Opportunity", typeContext: null, key: "sampleEstimatedValue", nameDisplay: "[Sample] Estimated Value", group: "[Sample] General", subGroup: "Value", dataType: "Decimal", sortOrder: 30 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000004", entity: "Opportunity", typeContext: null, key: "sampleApplicationRequired", nameDisplay: "[Sample] Application Required", group: "[Sample] General", subGroup: "Application", dataType: "Boolean", sortOrder: 40 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000005", entity: "Opportunity", typeContext: null, key: "sampleApplicationDeadline", nameDisplay: "[Sample] Application Deadline", group: "[Sample] General", subGroup: "Application", dataType: "DateTime", sortOrder: 50 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000006", entity: "Opportunity", typeContext: null, key: "sampleDeliveryMode", nameDisplay: "[Sample] Delivery Mode", group: "[Sample] General", subGroup: "Delivery", dataType: "Option", supportsMultiple: false, sortOrder: 60 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000007", entity: "Opportunity", typeContext: null, key: "sampleParticipationBenefits", nameDisplay: "[Sample] Participation Benefits", group: "[Sample] General", subGroup: "Benefits", dataType: "Option", supportsMultiple: true, sortOrder: 70 },
  // Opportunity — Job
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000008", entity: "Opportunity", typeContext: "Job", key: "jobWorkType", nameDisplay: "[Sample] Work Type", group: "[Sample] Job Details", subGroup: "Employment", dataType: "Option", supportsMultiple: false, sortOrder: 10, required: true },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000009", entity: "Opportunity", typeContext: "Job", key: "jobSalary", nameDisplay: "[Sample] Salary", group: "[Sample] Job Details", subGroup: "Compensation", dataType: "Decimal", sortOrder: 20 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000010", entity: "Opportunity", typeContext: "Job", key: "jobMinimumQualification", nameDisplay: "[Sample] Minimum Qualification", group: "[Sample] Job Details", subGroup: "Requirements", dataType: "Option", supportsMultiple: false, sortOrder: 30 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000011", entity: "Opportunity", typeContext: "Job", key: "jobExperienceLevel", nameDisplay: "[Sample] Experience Level", group: "[Sample] Job Details", subGroup: "Requirements", dataType: "Option", supportsMultiple: false, sortOrder: 40 },
  // Opportunity — Learning
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000012", entity: "Opportunity", typeContext: "Learning", key: "learningDeliveryFormat", nameDisplay: "[Sample] Learning Format", group: "[Sample] Learning Details", subGroup: "Delivery", dataType: "Option", supportsMultiple: false, sortOrder: 10 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000013", entity: "Opportunity", typeContext: "Learning", key: "learningCertificateProvided", nameDisplay: "[Sample] Certificate Provided", group: "[Sample] Learning Details", subGroup: "Outcome", dataType: "Boolean", sortOrder: 20 },
  // Opportunity — Event / Task / Other (present so the type selector has more than two live contexts)
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000014", entity: "Opportunity", typeContext: "Event", key: "eventVenueName", nameDisplay: "[Sample] Venue Name", group: "[Sample] Event Details", subGroup: "Venue", dataType: "String", sortOrder: 10 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000015", entity: "Opportunity", typeContext: "Event", key: "eventRegistrationDeadline", nameDisplay: "[Sample] Registration Deadline", group: "[Sample] Event Details", subGroup: "Registration", dataType: "DateTime", sortOrder: 20 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000016", entity: "Opportunity", typeContext: "Task", key: "taskEstimatedMinutes", nameDisplay: "[Sample] Estimated Minutes", group: "[Sample] Task Details", subGroup: "Effort", dataType: "Integer", sortOrder: 10 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000017", entity: "Opportunity", typeContext: "Task", key: "taskParticipationMode", nameDisplay: "[Sample] Participation Mode", group: "[Sample] Task Details", subGroup: "Participation", dataType: "Option", supportsMultiple: false, sortOrder: 20 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000018", entity: "Opportunity", typeContext: "Other", key: "otherOpportunityLabel", nameDisplay: "[Sample] Opportunity Label", group: "[Sample] Other Details", subGroup: "Classification", dataType: "String", sortOrder: 10 },
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-000000000019", entity: "Opportunity", typeContext: "Other", key: "otherReferenceValue", nameDisplay: "[Sample] Reference Value", group: "[Sample] Other Details", subGroup: "Value", dataType: "Decimal", sortOrder: 20 },
  // Opportunity — retired. Mapped on Opportunity|Learning|Certificate but no longer active, so it
  // is returned by the schema (ListAll) and withheld by discovery (List) — the stale-mapping case.
  // prettier-ignore
  { id: "a1000000-0000-4000-8000-0000000000ff", entity: "Opportunity", typeContext: null, key: "sampleRetiredEligibilityNote", nameDisplay: "[Sample] Eligibility Note (retired)", group: "[Sample] General", subGroup: "Basics", dataType: "String", sortOrder: 15, isActive: false, isSchemaMapped: true },

  // MyOpportunity — generic
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000001", entity: "MyOpportunity", typeContext: null, key: "completionReflection", nameDisplay: "[Sample] Completion Reflection", group: "[Sample] Completion", subGroup: "Reflection", dataType: "String", sortOrder: 10 },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000002", entity: "MyOpportunity", typeContext: null, key: "completionHoursSpent", nameDisplay: "[Sample] Hours Spent", group: "[Sample] Completion", subGroup: "Effort", dataType: "Integer", sortOrder: 20 },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000003", entity: "MyOpportunity", typeContext: null, key: "completionScore", nameDisplay: "[Sample] Completion Score", group: "[Sample] Completion", subGroup: "Outcome", dataType: "Decimal", sortOrder: 30 },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000004", entity: "MyOpportunity", typeContext: null, key: "completionWouldRecommend", nameDisplay: "[Sample] Would Recommend", group: "[Sample] Completion", subGroup: "Feedback", dataType: "Boolean", sortOrder: 40 },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000005", entity: "MyOpportunity", typeContext: null, key: "completionAchievedAt", nameDisplay: "[Sample] Achievement Date", group: "[Sample] Completion", subGroup: "Outcome", dataType: "DateTime", sortOrder: 50 },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000006", entity: "MyOpportunity", typeContext: null, key: "completionOutcome", nameDisplay: "[Sample] Completion Outcome", group: "[Sample] Completion", subGroup: "Outcome", dataType: "Option", supportsMultiple: false, sortOrder: 60 },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000007", entity: "MyOpportunity", typeContext: null, key: "completionHighlights", nameDisplay: "[Sample] Completion Highlights", group: "[Sample] Completion", subGroup: "Highlights", dataType: "Option", supportsMultiple: true, sortOrder: 70 },
  // MyOpportunity — Job
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000008", entity: "MyOpportunity", typeContext: "Job", key: "jobPlacementStatus", nameDisplay: "[Sample] Placement Status", group: "[Sample] Job Completion", subGroup: "Placement", dataType: "Option", supportsMultiple: false, sortOrder: 10, required: true },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000009", entity: "MyOpportunity", typeContext: "Job", key: "jobProbationCompleted", nameDisplay: "[Sample] Probation Completed", group: "[Sample] Job Completion", subGroup: "Placement", dataType: "Boolean", sortOrder: 20 },
  // MyOpportunity — Learning
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000010", entity: "MyOpportunity", typeContext: "Learning", key: "learningAssessmentScore", nameDisplay: "[Sample] Assessment Score", group: "[Sample] Learning Completion", subGroup: "Assessment", dataType: "Decimal", sortOrder: 10 },
  // prettier-ignore
  { id: "b1000000-0000-4000-8000-000000000011", entity: "MyOpportunity", typeContext: "Learning", key: "learningCredentialReceived", nameDisplay: "[Sample] Credential Received", group: "[Sample] Learning Completion", subGroup: "Outcome", dataType: "Boolean", sortOrder: 20 },
];

/** Ordering applied by SSIAttributePresentationHelper.OrderCustomFields. */
const sortCustomFields = (fields: SSISchemaEntityCustomField[]) =>
  [...fields].sort(
    (a, b) =>
      Number(!a.group) - Number(!b.group) ||
      a.group.localeCompare(b.group) ||
      (a.subGroup ?? "").localeCompare(b.subGroup ?? "") ||
      a.sortOrder - b.sortOrder ||
      a.nameDisplay.localeCompare(b.nameDisplay) ||
      a.attributeName.localeCompare(b.attributeName),
  );

/**
 * Discovery selection (SSISchemaEntityService.List): active fields only, generic plus — when a
 * context is supplied — the fields assigned to it. Fields from other contexts are excluded.
 */
const discoverCustomFields = (
  entity: CustomFieldSeed["entity"],
  typeContext: string | null,
): SSISchemaEntityCustomField[] =>
  sortCustomFields(
    CUSTOM_FIELD_SEEDS.filter(
      (seed) =>
        seed.entity === entity &&
        (seed.isActive ?? true) &&
        (seed.typeContext === null ||
          (typeContext != null &&
            seed.typeContext.toLowerCase() === typeContext.toLowerCase())),
    ).map(toCustomField),
  );

/** Schema rendering selection (SSISchemaEntityService.ListAll): every context, active or not. */
const allCustomFields = (): SSISchemaEntityCustomField[] =>
  CUSTOM_FIELD_SEEDS.map(toCustomField);

// ---------------------------------------------------------------------------
// Entity discovery (GET /ssi/schema/entity)
// ---------------------------------------------------------------------------

const STATIC_ENTITIES = [
  {
    id: ENTITY_ID_MYOPPORTUNITY,
    name: "MyOpportunity" as const,
    properties: PROPERTIES_MYOPPORTUNITY,
    types: TYPES_OPPORTUNITY,
  },
  {
    id: ENTITY_ID_OPPORTUNITY,
    name: "Opportunity" as const,
    properties: PROPERTIES_OPPORTUNITY,
    types: TYPES_OPPORTUNITY,
  },
  {
    id: ENTITY_ID_ORGANIZATION,
    name: "Organization" as const,
    properties: PROPERTIES_ORGANIZATION,
    types: TYPES_YOID,
  },
  {
    id: ENTITY_ID_USER,
    name: "User" as const,
    properties: PROPERTIES_USER,
    types: TYPES_YOID,
  },
];

const buildEntities = (
  schemaType: SchemaType | undefined,
  typeContext: string | null,
): SSISchemaEntity[] =>
  STATIC_ENTITIES.filter(
    (entity) =>
      schemaType === undefined ||
      entity.types.some((type) => type.type === SchemaType[schemaType]),
  ).map((entity) => ({
    id: entity.id,
    name: entity.name,
    properties: entity.properties,
    customFields:
      entity.name === "Opportunity" || entity.name === "MyOpportunity"
        ? discoverCustomFields(entity.name, typeContext)
        : [],
    types: entity.types,
  }));

// ---------------------------------------------------------------------------
// Schemas (GET /ssi/schema, GET /ssi/schema/{name})
// ---------------------------------------------------------------------------

/**
 * Builds the entity projection the API returns on a schema: only the attributes the schema
 * actually maps, matched against every context and both active and inactive definitions
 * (SSISchemaService.ConvertToSSISchema). Internal `_`-prefixed attributes are not represented.
 */
const projectEntities = (attributeNames: string[]): SSISchemaEntity[] => {
  const wanted = new Set(attributeNames.map((name) => name.toLowerCase()));
  const customFields = allCustomFields();

  return STATIC_ENTITIES.map((entity) => ({
    id: entity.id,
    name: entity.name,
    properties: entity.properties.filter((property) =>
      wanted.has(property.attributeName.toLowerCase()),
    ),
    customFields: sortCustomFields(
      customFields.filter(
        (field) =>
          field.attributeName.startsWith(`${entity.name}_`) &&
          wanted.has(field.attributeName.toLowerCase()),
      ),
    ),
    types: entity.types,
  })).filter(
    (entity) =>
      (entity.properties?.length ?? 0) + (entity.customFields?.length ?? 0) > 0,
  );
};

const countFields = (entities: SSISchemaEntity[]) =>
  entities.reduce(
    (total, entity) =>
      total +
      (entity.properties?.length ?? 0) +
      (entity.customFields?.length ?? 0),
    0,
  );

const buildSchema = (args: {
  displayName: string;
  schemaType: SSISchemaType;
  typeContext: string | null;
  artifactType: keyof typeof ArtifactType;
  version: string;
  attributes: string[];
}): SSISchema => {
  const fullName = [
    args.schemaType.name,
    ...(args.typeContext ? [args.typeContext] : []),
    args.displayName,
  ].join("|");
  const entities = projectEntities(args.attributes);

  return {
    id: `WgWxqztrNooG92RXvxSTWv:2:${fullName}:${args.version}`,
    name: fullName,
    displayName: args.displayName,
    typeId: args.schemaType.id,
    type: args.schemaType.type,
    typeDescription: args.schemaType.description,
    typeContext: args.typeContext,
    version: args.version,
    artifactType: args.artifactType,
    artifactTypeDescription: args.artifactType === "ACR" ? "AnonCreds" : "JWS",
    entities,
    propertyCount: countFields(entities),
  };
};

const OPPORTUNITY_SYSTEM_ATTRIBUTES = [
  "Opportunity_Title",
  "Opportunity_OrganizationName",
  "Opportunity_OrganizationLogoURL",
];

const YOID_SYSTEM_ATTRIBUTES = [
  "User_DisplayName",
  "Organization_Name",
  "Organization_LogoURL",
];

const buildInitialSchemas = (): SSISchema[] => [
  // Generic — matches the shipped `Opportunity|Default`.
  buildSchema({
    displayName: "Default",
    schemaType: SCHEMA_TYPES[0]!,
    typeContext: null,
    artifactType: "JWS",
    version: "1.0",
    attributes: [
      ...OPPORTUNITY_SYSTEM_ATTRIBUTES,
      "Opportunity_Summary",
      "Opportunity_Type",
      "Opportunity_Skills",
      "MyOpportunity_UserDisplayName",
      "MyOpportunity_DateCompleted",
    ],
  }),
  // Type-specific, with removable custom-field mappings from both entities.
  buildSchema({
    displayName: "Placement",
    schemaType: SCHEMA_TYPES[0]!,
    typeContext: "Job",
    artifactType: "JWS",
    version: "2.0",
    attributes: [
      ...OPPORTUNITY_SYSTEM_ATTRIBUTES,
      "Opportunity_Type",
      "Opportunity_Skills",
      "Opportunity_jobWorkType",
      "Opportunity_jobSalary",
      "Opportunity_sampleApplicationDeadline",
      "MyOpportunity_UserDisplayName",
      "MyOpportunity_DateCompleted",
      "MyOpportunity_jobPlacementStatus",
    ],
  }),
  // Type-specific carrying one retired mapping — active fields stay removable, the retired one
  // can only be dropped.
  buildSchema({
    displayName: "Certificate",
    schemaType: SCHEMA_TYPES[0]!,
    typeContext: "Learning",
    artifactType: "ACR",
    version: "1.0",
    attributes: [
      ...OPPORTUNITY_SYSTEM_ATTRIBUTES,
      "Opportunity_Type",
      "Opportunity_learningDeliveryFormat",
      "Opportunity_learningCertificateProvided",
      "Opportunity_sampleRetiredEligibilityNote",
      "MyOpportunity_UserDisplayName",
      "MyOpportunity_learningAssessmentScore",
    ],
  }),
  // Regression: YoID is unaffected by type contexts and does not support multiple schemas.
  buildSchema({
    displayName: "Default",
    schemaType: SCHEMA_TYPES[1]!,
    typeContext: null,
    artifactType: "ACR",
    version: "1.0",
    attributes: [
      ...YOID_SYSTEM_ATTRIBUTES,
      "User_Email",
      "User_FirstName",
      "User_Surname",
      "User_DateOfBirth",
      "User_Country",
    ],
  }),
];

/** Mutable for the session so create/update behave like the real thing. Reset on reload. */
let store: SSISchema[] = buildInitialSchemas();

/** Deep-links surfaced by the mock banner. */
export const SCHEMA_ADMIN_MOCK_FIXTURES = [
  { label: "generic", name: "Opportunity|Default" },
  { label: "type-specific", name: "Opportunity|Job|Placement" },
  { label: "stale mapping", name: "Opportunity|Learning|Certificate" },
  { label: "YoID", name: "YoID|Default" },
];

// ---------------------------------------------------------------------------
// Mocked service surface — signatures match ~/api/services/credentials exactly, including the
// unused `context` argument, so the façade in ~/api/services/credentialSchemaAdmin typechecks
// against the real service whichever side of the flag it is on.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-unused-vars -- `_context` exists for signature parity */

export const getSchemaTypes = async (
  _context?: GetServerSidePropsContext,
): Promise<SSISchemaType[]> => {
  await sleep();
  return SCHEMA_TYPES;
};

export const getSchemaEntities = async (
  schemaType?: SchemaType,
  typeContext?: string | null,
  _context?: GetServerSidePropsContext,
): Promise<SSISchemaEntity[]> => {
  await sleep();
  return buildEntities(schemaType, typeContext ?? null);
};

export const getSchemas = async (
  schemaType?: SchemaType,
  typeContext?: string | null,
  _context?: GetServerSidePropsContext,
): Promise<SSISchema[]> => {
  await sleep();

  let results = store;
  if (schemaType !== undefined && schemaType !== null)
    results = results.filter(
      (schema) => schema.type === SchemaType[schemaType],
    );
  if (typeContext)
    results = results.filter(
      (schema) =>
        !schema.typeContext ||
        schema.typeContext.toLowerCase() === typeContext.toLowerCase(),
    );

  return results;
};

export const getSchemaByName = async (
  name: string,
  _context?: GetServerSidePropsContext,
): Promise<SSISchema> => {
  await sleep();

  const schema = store.find((item) => item.name === name);
  if (!schema)
    throw mockApiError(404, `Schema with name '${name}' does not exists`);
  return schema;
};

export const createSchema = async (
  model: SSISchemaRequestCreate,
): Promise<SSISchema> => {
  await sleep();

  const schemaType = SCHEMA_TYPES.find((type) => type.id === model.typeId);
  if (!schemaType)
    throw mockApiError(400, "Specified type is invalid / does not exist.");

  const artifactType = (
    typeof model.artifactType === "number"
      ? ArtifactType[model.artifactType]
      : (model.artifactType ?? "JWS")
  ) as keyof typeof ArtifactType;

  const typeContext =
    schemaType.type === "Opportunity" ? model.typeContext : null;
  const created = buildSchema({
    displayName: model.name.trim(),
    schemaType,
    typeContext: typeContext?.trim() || null,
    artifactType,
    version: "1.0",
    // the API prefixes system attributes that were not submitted
    attributes: withSystemAttributes(schemaType.type, model.attributes),
  });

  if (store.some((schema) => schema.name === created.name))
    throw mockApiError(400, `Schema '${created.name}' already exists`);

  if (
    !schemaType.supportMultiple &&
    store.some((schema) => schema.typeId === schemaType.id)
  )
    throw mockApiError(
      400,
      `Schema type '${schemaType.name}' does not support multiple schemas.`,
    );

  store = [...store, created];
  return created;
};

export const updateSchema = async (
  model: SSISchemaRequestUpdate,
): Promise<SSISchema> => {
  await sleep();

  const existing = store.find((schema) => schema.name === model.name);
  if (!existing)
    throw mockApiError(404, `Schema with name '${model.name}' does not exists`);

  const schemaType = SCHEMA_TYPES.find((type) => type.id === existing.typeId)!;

  // The API validates the submitted attributes against the *active*, in-context discovery set, so a
  // resubmitted retired mapping is rejected rather than carried forward.
  const available = new Set(
    buildEntities(
      SchemaType[schemaType.name as keyof typeof SchemaType],
      existing.typeContext,
    )
      .flatMap((entity) => [
        ...(entity.properties ?? []).map((property) => property.attributeName),
        ...(entity.customFields ?? []).map((field) => field.attributeName),
      ])
      .map((name) => name.toLowerCase()),
  );
  const invalid = model.attributes.filter(
    (name) => !available.has(name.toLowerCase()),
  );
  if (invalid.length)
    throw mockApiError(
      400,
      `Request contains attributes that are not available for the specified schema type and context: '${invalid.join(",")}'`,
    );

  const updated = buildSchema({
    displayName: existing.displayName,
    schemaType,
    typeContext: existing.typeContext,
    artifactType: existing.artifactType as keyof typeof ArtifactType,
    version: nextVersion(existing.version),
    attributes: withSystemAttributes(schemaType.type, model.attributes),
  });

  store = store.map((schema) =>
    schema.name === updated.name ? updated : schema,
  );
  return updated;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const withSystemAttributes = (
  schemaType: SchemaType | string,
  attributes: string[],
): string[] => {
  const system =
    schemaType === "YoID"
      ? YOID_SYSTEM_ATTRIBUTES
      : OPPORTUNITY_SYSTEM_ATTRIBUTES;
  const supplied = new Set(attributes.map((name) => name.toLowerCase()));
  return [
    ...system.filter((name) => !supplied.has(name.toLowerCase())),
    ...attributes,
  ];
};

const nextVersion = (version: string): string => {
  const [major, minor] = version.split(".");
  return `${major}.${Number(minor ?? 0) + 1}`;
};

/** Shaped like an AxiosError so <ApiErrors /> renders it the way it renders a real failure. */
const mockApiError = (status: number, message: string) => ({
  isAxiosError: true,
  message,
  response: {
    status,
    data: { errors: [{ type: "Validation", message }] },
  },
});
