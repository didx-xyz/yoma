import { zodResolver } from "@hookform/resolvers/zod";
import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useState,
  type ReactElement,
  useEffect,
  useMemo,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Select from "react-select";
import { toast } from "react-toastify";
import z from "zod";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoMdArrowRoundBack, IoMdLock } from "react-icons/io";
import type { NextPageWithLayout } from "~/pages/_app";
import axios from "axios";
import {
  createSchema,
  updateSchema,
  getSchemaByName,
  getSchemaTypes,
  getSchemaEntities,
  SCHEMA_ADMIN_MOCK_ENABLED,
} from "~/api/services/credentialSchemaAdmin";
import { getOpportunityTypes } from "~/api/services/opportunities";
import {
  ARTIFACT_TYPE_LABELS,
  ArtifactType,
  SchemaType,
  type SSISchema,
  type SSISchemaType,
} from "~/api/models/credential";
import type { OpportunityType } from "~/api/models/opportunity";
import {
  SchemaAttributesEdit,
  type SchemaRetiredAttribute,
} from "~/components/Schema/SchemaAttributesEdit";
import { ROLE_ADMIN, THEME_BLUE } from "~/lib/constants";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { analytics } from "~/lib/analytics";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
// ⚠️ TEMPORARY — mock dev aid; delete this import with the blocks it feeds
import { SchemaAdminMockBanner } from "~/components/Schema/SchemaAdminMockBanner";

interface IParams extends ParsedUrlQuery {
  id: string;
}

/** Working state for the wizard. Identity fields are only editable while creating. */
interface SchemaFormState {
  /** Friendly name when creating; the full provider name when updating. */
  name: string;
  typeId: string;
  /** Opportunity schemas only — the Opportunity Type *name*. null = generic. */
  typeContext: string | null;
  artifactType: ArtifactType | null;
  attributes: string[];
}

const EMPTY_FORM: SchemaFormState = {
  name: "",
  typeId: "",
  typeContext: null,
  artifactType: null,
  attributes: [],
};

/** Non-system statics and mapped custom fields — what the admin actually chose. */
const mappedAttributes = (schema: SSISchema | undefined): string[] =>
  schema?.entities?.flatMap((entity) => [
    ...(entity.properties ?? [])
      .filter((property) => !property.system)
      .map((property) => property.attributeName),
    ...(entity.customFields ?? []).map((field) => field.attributeName),
  ]) ?? [];

const toFormState = (schema: SSISchema | undefined): SchemaFormState => {
  if (!schema) return EMPTY_FORM;

  return {
    name: schema.name,
    typeId: schema.typeId,
    typeContext: schema.typeContext,
    // the enum arrives as its name ("JWS" / "ACR"), not an ordinal
    artifactType:
      typeof schema.artifactType === "string"
        ? (ArtifactType[
            schema.artifactType as keyof typeof ArtifactType
          ] as ArtifactType)
        : schema.artifactType,
    attributes: mappedAttributes(schema),
  };
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const queryClient = new QueryClient(config);
  let errorCode = null;

  // 👇 ensure authenticated and authorized
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }
  if (!session.user?.roles?.includes(ROLE_ADMIN)) {
    return {
      props: {
        error: 403,
      },
    };
  }

  // ⚠️ TEMPORARY: with the mock active the store lives in the browser, so server prefetching would
  // hydrate a stale copy that never refetches (staleTime is an hour). Remove with the mock.
  if (!SCHEMA_ADMIN_MOCK_ENABLED) {
    try {
      const dataSchemaTypes = await getSchemaTypes(context);

      await queryClient.prefetchQuery({
        queryKey: ["schemaTypes"],
        queryFn: () => dataSchemaTypes,
      });

      if (id !== "create") {
        const data = await getSchemaByName(id, context);
        await queryClient.prefetchQuery({
          queryKey: ["schema", id],
          queryFn: () => data,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status) {
        if (error.response.status === 404) {
          return {
            notFound: true,
          };
        } else errorCode = error.response.status;
      } else errorCode = 500;
    }
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      error: errorCode,
    },
  };
}

const SchemaCreateEdit: NextPageWithLayout<{
  id: string;
  user: User;
  error?: number;
}> = ({ id, error }) => {
  const queryClient = useQueryClient();
  const isCreate = id === "create";

  const { data: schema } = useQuery<SSISchema>({
    queryKey: ["schema", id],
    queryFn: () => getSchemaByName(id),
    enabled: !isCreate && !error,
  });
  const { data: schemaTypes } = useQuery<SSISchemaType[]>({
    queryKey: ["schemaTypes"],
    queryFn: () => getSchemaTypes(),
    enabled: !error,
  });
  const { data: opportunityTypes } = useQuery<OpportunityType[]>({
    queryKey: ["opportunityTypes"],
    queryFn: () => getOpportunityTypes(),
    enabled: !error,
  });

  const schemaTypeOptions = useMemo(
    () =>
      schemaTypes?.map((type) => ({ value: type.id, label: type.name })) ?? [],
    [schemaTypes],
  );

  // Submits the stable Opportunity Type name; displays the editable display name.
  const opportunityTypeOptions = useMemo(
    () => [
      { value: "", label: "Generic — all opportunity types" },
      ...(opportunityTypes?.map((type) => ({
        value: type.name,
        label: type.displayName || type.name,
      })) ?? []),
    ],
    [opportunityTypes],
  );

  const artifactTypeOptions = useMemo(
    () =>
      Object.keys(ArtifactType)
        .filter((key) => isNaN(Number(key)))
        .map((key) => ({
          value: ArtifactType[key as keyof typeof ArtifactType],
          label: ARTIFACT_TYPE_LABELS[key as keyof typeof ArtifactType],
        })),
    [],
  );

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SchemaFormState>(() =>
    isCreate ? EMPTY_FORM : toFormState(schema),
  );

  const handleCancel = () => {
    void router.push(`/admin/schemas`);
  };

  const onSubmit = useCallback(
    async (data: SchemaFormState) => {
      setIsLoading(true);

      try {
        // update api — identity is immutable, so an update carries the full name and attributes only
        if (isCreate)
          await createSchema({
            name: data.name,
            typeId: data.typeId,
            typeContext: data.typeContext,
            artifactType: data.artifactType,
            attributes: data.attributes,
          });
        else
          await updateSchema({
            name: data.name,
            attributes: data.attributes,
          });

        // 📊 ANALYTICS: track schema creation/update
        analytics.trackEvent("admin_schema_saved", {
          schemaName: data.name,
          action: isCreate ? "created" : "updated",
        });

        toast(`Schema ${isCreate ? "created" : "updated"}.`, {
          type: "success",
          toastId: "schema",
        });

        // invalidate queries — the list is keyed `Schemas_{query}_{page}`
        await queryClient.invalidateQueries({
          predicate: (query) =>
            typeof query.queryKey[0] === "string" &&
            query.queryKey[0].startsWith("Schemas_"),
        });
        await queryClient.invalidateQueries({ queryKey: ["schema", id] });
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "schema",
          autoClose: false,
          icon: false,
        });

        setIsLoading(false);

        return;
      }

      setIsLoading(false);

      // redirect to list after create
      if (isCreate) void router.push(`/admin/schemas`);
    },
    [setIsLoading, id, isCreate, queryClient],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: Partial<SchemaFormState>) => {
      // identity drives which attributes are applicable, so a change to it invalidates the selection
      const identityChanged =
        isCreate &&
        step === 2 &&
        (formData.typeId != data.typeId ||
          (formData.typeContext ?? null) != (data.typeContext ?? null));

      const model: SchemaFormState = {
        ...formData,
        ...data,
        // `typeContext` is only in `data` on the step-1 submit, where a null means the admin chose
        // generic — a deliberate value, not a missing one, so it must not fall back to the previous
        // selection. Later steps omit the key entirely and keep what was chosen.
        typeContext:
          ("typeContext" in data ? data.typeContext : formData.typeContext) ??
          null,
        ...(identityChanged ? { attributes: [] } : {}),
      };
      setFormData(model);

      if (isCreate) {
        if (step === 4) {
          // submit on last page when creating new schema
          await onSubmit(model);
          return;
        }
      } else {
        if (step === 3) {
          // submit on last page when updating schema
          await onSubmit(model);
          return;
        }
      }
      setStep(step);
    },
    [isCreate, setStep, formData, setFormData, onSubmit],
  );

  const schemaName = z
    .string()
    .min(1, "Schema name is required.")
    .max(255, "Schema name cannot exceed 255 characters.");

  const schemaStep1 = z.object({
    // When creating, this is the friendly name and the API composes the full name from it, so the
    // delimiters are reserved. When updating it *is* the full name — `Opportunity|Job|Placement` —
    // and holds those very characters, so the rule must not apply.
    name: isCreate
      ? schemaName.refine((value) => !/[|:]/.test(value), {
          message: "Schema name cannot contain the characters | or :",
        })
      : schemaName,
    typeId: z
      .string({ required_error: "Schema type is required." })
      .min(1, "Schema type is required."),
    typeContext: z.string().nullable().optional(),
    artifactType: z.number({
      invalid_type_error: "Artifact type is required.",
    }),
  });

  const schemaStep2 = z.object({
    attributes: z
      .array(z.string())
      .min(1, "At least one attribute is required."),
  });

  const schemaStep3 = z.object({});

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1, isValid: isValidStep1 },
    control: controlStep1,
    reset: resetStep1,
    setValue: setValueStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
  });

  const {
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2, isValid: isValidStep2 },
    control: controlStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
  });

  const {
    handleSubmit: handleSubmitStep3,
    formState: { isValid: isValidStep3 },
  } = useForm({
    resolver: zodResolver(schemaStep3),
    defaultValues: formData,
  });

  // the schema arrives after first render (and always does with the mock, which skips SSR
  // prefetching), so seed the wizard once it lands
  useEffect(() => {
    if (isCreate || !schema) return;
    const seeded = toFormState(schema);
    setFormData(seeded);
    resetStep1(seeded);
  }, [isCreate, schema, resetStep1]);

  const watchedTypeId = useWatch({ control: controlStep1, name: "typeId" });
  const watchedSchemaType = schemaTypes?.find(
    (type) => type.id === watchedTypeId,
  );
  // the type context is defined for Opportunity schemas only
  const supportsTypeContext = watchedSchemaType?.type === "Opportunity";

  useEffect(() => {
    if (!isCreate || supportsTypeContext) return;
    setValueStep1("typeContext", null);
  }, [isCreate, supportsTypeContext, setValueStep1]);

  // scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const committedSchemaType = schemaTypes?.find(
    (type) => type.id === formData.typeId,
  );

  const { data: schemaEntities } = useQuery({
    queryKey: ["schemaEntities", formData.typeId, formData.typeContext],
    queryFn: () =>
      getSchemaEntities(
        SchemaType[committedSchemaType!.name as keyof typeof SchemaType],
        formData.typeContext,
      ),
    enabled: !!committedSchemaType && !error,
  });

  const systemProperties = useMemo(
    () =>
      (schemaEntities ?? []).flatMap((entity) =>
        (entity.properties ?? [])
          .filter((property) => property.system)
          .map((property) => ({
            entityName: entity.name,
            nameDisplay: property.nameDisplay,
            attributeName: property.attributeName,
          })),
      ),
    [schemaEntities],
  );

  /** Every attribute discovery currently offers for this schema type and context. */
  const availableAttributes = useMemo(
    () =>
      new Set(
        (schemaEntities ?? []).flatMap((entity) => [
          ...(entity.properties ?? [])
            .filter((property) => !property.system)
            .map((property) => property.attributeName),
          ...(entity.customFields ?? []).map((field) => field.attributeName),
        ]),
      ),
    [schemaEntities],
  );

  /**
   * Mappings on the current version that discovery no longer offers — a deactivated custom field,
   * say. The API rejects them if resubmitted, so they are surfaced and then dropped.
   */
  const retiredAttributes = useMemo<SchemaRetiredAttribute[]>(() => {
    if (isCreate || !schema || !schemaEntities) return [];

    return schema.entities.flatMap((entity) => [
      ...(entity.properties ?? [])
        .filter(
          (property) =>
            !property.system &&
            !availableAttributes.has(property.attributeName),
        )
        .map((property) => ({
          attributeName: property.attributeName,
          nameDisplay: property.nameDisplay,
          entityName: entity.name,
          detail: null,
        })),
      ...(entity.customFields ?? [])
        .filter((field) => !availableAttributes.has(field.attributeName))
        .map((field) => ({
          attributeName: field.attributeName,
          nameDisplay: field.nameDisplay,
          entityName: entity.name,
          detail:
            [field.group, field.subGroup].filter(Boolean).join(" · ") || null,
        })),
    ]);
  }, [isCreate, schema, schemaEntities, availableAttributes]);

  /** Resolves an attribute back to its datasource and display name for the review step. */
  const describeAttribute = useCallback(
    (attributeName: string) => {
      for (const entity of schemaEntities ?? []) {
        const property = entity.properties?.find(
          (candidate) => candidate.attributeName === attributeName,
        );
        if (property)
          return { entityName: entity.name, nameDisplay: property.nameDisplay };

        const field = entity.customFields?.find(
          (candidate) => candidate.attributeName === attributeName,
        );
        if (field)
          return { entityName: entity.name, nameDisplay: field.nameDisplay };
      }
      return { entityName: "", nameDisplay: attributeName };
    },
    [schemaEntities],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  const readOnlyIdentityHint = "Cannot be changed for existing schemas";

  return (
    <>
      {isLoading && <Loading />}
      <PageBackground />

      <div className="z-10 container mt-20 max-w-5xl px-2 py-4">
        {/* ⚠️⚠️ TEMPORARY MOCK BANNER — delete with the mock ⚠️⚠️ */}
        {SCHEMA_ADMIN_MOCK_ENABLED && (
          <SchemaAdminMockBanner current={schema?.name} />
        )}

        {/* BREADCRUMB */}
        <div className="breadcrumbs text-sm text-white">
          <ul>
            <li>
              <Link
                className="hover:text-gray font-bold text-white"
                href={`/admin/schemas`}
              >
                <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
                Schemas
              </Link>
            </li>
            <li>
              <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
                {isCreate ? "Create" : <>{schema?.displayName}</>}
              </div>
            </li>
          </ul>
        </div>

        <h4 className="pb-2 pl-5 text-white">
          {isCreate ? "New schema" : schema?.displayName}
        </h4>

        <div className="flex flex-col gap-2 md:flex-row">
          {/* left vertical menu */}
          <ul className="menu hidden max-h-[145px] w-64 flex-none gap-2 rounded-lg bg-white p-2 font-semibold md:flex">
            <li onClick={() => setStep(1)}>
              <a
                className={`${
                  step === 1
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark hover:bg-gray"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep1 ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  1
                </span>
                General information
              </a>
            </li>
            <li onClick={() => setStep(2)}>
              <a
                className={`${
                  step === 2
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark hover:bg-gray"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep2 ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  2
                </span>
                Attributes
              </a>
            </li>

            {/* only show preview when creating new schema */}
            {isCreate && (
              <li onClick={() => setStep(3)}>
                <a
                  className={`${
                    step === 3
                      ? "bg-green-light text-green hover:bg-green-light active:bg-green-light"
                      : "bg-gray text-gray-dark"
                  }`}
                >
                  <span
                    className={`bg-gray-dark mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                      isValidStep1 && isValidStep2 && isValidStep3
                        ? "bg-green"
                        : "bg-gray-dark"
                    }`}
                  >
                    3
                  </span>
                  Review
                </a>
              </li>
            )}
          </ul>
          {/* dropdown menu */}
          <select
            className="select select-sm md:hidden"
            onChange={(e) => {
              switch (e.target.value) {
                case "General information":
                  setStep(1);
                  break;
                case "Attributes":
                  setStep(2);
                  break;
                case "Review":
                  setStep(3);
                  break;
                default:
                  setStep(1);
                  break;
              }
            }}
          >
            <option>General information</option>
            <option>Attributes</option>
            {isCreate && <option>Review</option>}
          </select>

          {/* forms */}
          <div className="flex grow flex-col items-center rounded-lg bg-white">
            <div className="flex w-full max-w-xl flex-col p-4">
              {step === 1 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">General information</h6>
                    {!isCreate && (
                      <p className="text-gray-dark my-2 text-sm">
                        Schema identity is fixed once the schema exists. Change
                        the attributes on the next step — saving publishes a new
                        version.
                      </p>
                    )}
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data as Partial<SchemaFormState>),
                    )}
                  >
                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text">Schema name</span>
                      </label>
                      {isCreate && (
                        <input
                          type="text"
                          className="input border-gray focus:border-gray rounded-md focus:outline-none"
                          placeholder="Enter schema name"
                          {...registerStep1("name")}
                          contentEditable
                        />
                      )}

                      {!isCreate && (
                        <input
                          type="text"
                          className="input border-gray focus:border-gray rounded-md focus:outline-none"
                          value={schema?.displayName ?? ""}
                          contentEditable
                          disabled={true}
                          readOnly
                        />
                      )}

                      {errorsStep1.name && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep1.name.message}`}
                          </span>
                        </label>
                      )}

                      {!isCreate && (
                        <label className="label">
                          <span className="label-text-alt text-gray-dark italic">
                            {readOnlyIdentityHint}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text">Schema type</span>
                      </label>
                      <Controller
                        control={controlStep1}
                        name="typeId"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            classNames={{
                              control: () => "input",
                            }}
                            options={schemaTypeOptions}
                            onChange={(val) => onChange(val?.value)}
                            value={
                              schemaTypeOptions.find(
                                (c) => c.value === value,
                              ) ?? null
                            }
                            isDisabled={!isCreate}
                            placeholder="Select schema type"
                          />
                        )}
                      />

                      {errorsStep1.typeId && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep1.typeId.message}`}
                          </span>
                        </label>
                      )}

                      {!isCreate && (
                        <label className="label">
                          <span className="label-text-alt text-gray-dark italic">
                            {readOnlyIdentityHint}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {/* OPPORTUNITY TYPE — only meaningful for Opportunity schemas.
                        Hidden and cleared for every other schema type. */}
                    {supportsTypeContext && (
                      <fieldset className="fieldset">
                        <label className="label">
                          <span className="label-text">Opportunity type</span>
                        </label>
                        <Controller
                          control={controlStep1}
                          name="typeContext"
                          render={({ field: { onChange, value } }) => (
                            <Select
                              classNames={{
                                control: () => "input",
                              }}
                              options={opportunityTypeOptions}
                              onChange={(val) => onChange(val?.value || null)}
                              value={
                                opportunityTypeOptions.find(
                                  (c) => c.value === (value ?? ""),
                                ) ?? null
                              }
                              isDisabled={!isCreate}
                              placeholder="Select opportunity type"
                            />
                          )}
                        />

                        <label className="label">
                          <span className="label-text-alt text-gray-dark italic">
                            {isCreate
                              ? "Leave generic to make the schema available to every opportunity type."
                              : readOnlyIdentityHint}
                          </span>
                        </label>
                      </fieldset>
                    )}

                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text">Artifact type</span>
                      </label>

                      <Controller
                        control={controlStep1}
                        name="artifactType"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            classNames={{
                              control: () => "input",
                            }}
                            isMulti={false}
                            options={artifactTypeOptions}
                            onChange={(val) => onChange(val?.value)}
                            value={
                              artifactTypeOptions.find(
                                (option) => option.value === value,
                              ) ?? null
                            }
                            isDisabled={!isCreate}
                            placeholder="Select artifact type"
                          />
                        )}
                      />

                      {errorsStep1.artifactType && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep1.artifactType.message}`}
                          </span>
                        </label>
                      )}

                      {!isCreate && (
                        <label className="label">
                          <span className="label-text-alt text-gray-dark italic">
                            {readOnlyIdentityHint}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      {isCreate && (
                        <button
                          type="button"
                          className="btn btn-sm btn-warning grow"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-sm btn-success grow"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">Attributes</h6>
                    <p className="text-gray-dark my-2 text-sm">
                      Attributes available for this schema / opportunity type.
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data as Partial<SchemaFormState>),
                    )}
                  >
                    <fieldset className="fieldset">
                      <Controller
                        control={controlStep2}
                        name="attributes"
                        render={({ field: { onChange } }) => (
                          <SchemaAttributesEdit
                            defaultValue={formData.attributes}
                            schemaEntities={schemaEntities}
                            retiredAttributes={retiredAttributes}
                            onChange={onChange}
                          />
                        )}
                      />

                      {errorsStep2.attributes && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep2.attributes.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-warning grow"
                        onClick={() => {
                          setStep(1);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-sm btn-success grow"
                      >
                        {isCreate ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* only show preview when creating new schema */}
              {step === 3 && isCreate && (
                <>
                  <div className="mb-2 flex flex-col">
                    <h6 className="font-bold">Review</h6>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data as Partial<SchemaFormState>),
                    )}
                  >
                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text -ml-1 font-bold">
                          Schema name
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.name}
                      </label>
                      {errorsStep1.name && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep1.name.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text -ml-1 font-bold">
                          Schema type
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {committedSchemaType?.name}
                      </label>
                    </fieldset>

                    {supportsTypeContext && (
                      <fieldset className="fieldset">
                        <label className="label">
                          <span className="label-text -ml-1 font-bold">
                            Opportunity type
                          </span>
                        </label>
                        <label className="label-text text-sm">
                          {opportunityTypeOptions.find(
                            (option) =>
                              option.value === (formData.typeContext ?? ""),
                          )?.label ?? "Generic — all opportunity types"}
                        </label>
                      </fieldset>
                    )}

                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text -ml-1 font-bold">
                          Artifact type
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.artifactType != null
                          ? ARTIFACT_TYPE_LABELS[
                              ArtifactType[
                                formData.artifactType
                              ] as keyof typeof ArtifactType
                            ]
                          : ""}
                      </label>
                      {errorsStep1.artifactType && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep1.artifactType.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text -ml-1 font-bold">
                          Attributes
                        </span>
                      </label>

                      <div className="flex flex-col gap-2">
                        <table className="table w-full">
                          <thead>
                            <tr className="border-gray text-gray-dark">
                              <th className="w-65">Datasource</th>
                              <th>Attribute</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* System attributes */}
                            {systemProperties.map((property) => (
                              <tr
                                key={property.attributeName}
                                className="border-gray text-gray-dark"
                              >
                                <td>{property.entityName}</td>
                                <td>
                                  <IoMdLock
                                    className="mr-1 inline-block h-3 w-3"
                                    title="Always issued — cannot be removed"
                                  />
                                  {property.nameDisplay}
                                </td>
                              </tr>
                            ))}
                            {/* Additional attributes */}
                            {formData.attributes?.map((attribute) => {
                              const described = describeAttribute(attribute);
                              return (
                                <tr
                                  key={attribute}
                                  className="border-gray text-gray-dark"
                                >
                                  <td>{described.entityName}</td>
                                  <td>{described.nameDisplay}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {errorsStep2.attributes && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep2.attributes.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-warning grow"
                        onClick={() => {
                          setStep(2);
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-sm btn-success grow"
                        disabled={
                          !(isValidStep1 && isValidStep2 && isValidStep3)
                        }
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

SchemaCreateEdit.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

SchemaCreateEdit.theme = function getTheme() {
  return THEME_BLUE;
};

export default SchemaCreateEdit;
