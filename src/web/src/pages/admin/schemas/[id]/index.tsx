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
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import { toast } from "react-toastify";
import z from "zod";
import { type OpportunityRequestBase } from "~/api/models/opportunity";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoMdArrowRoundBack } from "react-icons/io";
import type { NextPageWithLayout } from "~/pages/_app";
import axios from "axios";
import {
  createSchema,
  updateSchema,
  getSchemaByName,
  getSchemaTypes,
  getSchemaEntities,
} from "~/api/services/credentials";
import {
  ArtifactType,
  SchemaType,
  type SSISchema,
  type SSISchemaRequest,
} from "~/api/models/credential";
import { SchemaAttributesEdit } from "~/components/Schema/SchemaAttributesEdit";
import type { SelectOption } from "~/api/models/lookups";
import {
  GA_ACTION_ADMIN_SCHEMA_CREATE,
  GA_CATEGORY_SCHEMA,
  THEME_BLUE,
} from "~/lib/constants";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { trackGAEvent } from "~/lib/google-analytics";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { id } = context.params as IParams;
  const queryClient = new QueryClient(config);
  let errorCode = null;

  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  try {
    const dataSchemaTypes = (await getSchemaTypes(context)).map((c) => ({
      value: c.id,
      label: c.name,
    }));

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

  const { data: schema } = useQuery<SSISchema>({
    queryKey: ["schema", id],
    queryFn: () => getSchemaByName(id),
    enabled: id !== "create",
  });
  const { data: schemaTypes } = useQuery<SelectOption[]>({
    queryKey: ["schemaTypes"],
    queryFn: async () =>
      (await getSchemaTypes()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    void router.push(`/admin/schemas`);
  };

  const [formData, setFormData] = useState<SSISchemaRequest>({
    name: schema?.name ?? "",
    typeId: schema?.typeId!,
    // enum value comes as string from server, convert to number
    artifactType: schema?.artifactType
      ? ArtifactType[schema.artifactType]
      : null,
    attributes:
      schema?.entities
        ?.flatMap((x) => x.properties)
        .filter((x) => x?.system == false)
        .map((x) => x?.attributeName!) ?? [],
  });

  const onSubmit = useCallback(
    async (data: SSISchemaRequest) => {
      setIsLoading(true);

      try {
        // update api
        if (id === "create") await createSchema(data);
        else await updateSchema(data);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_SCHEMA,
          GA_ACTION_ADMIN_SCHEMA_CREATE,
          `Schema '${data.name}' ${id == "create" ? "created" : "updated"}.`,
        );

        toast(`Schema ${id == "create" ? "created" : "updated"}.`, {
          type: "success",
          toastId: "schema",
        });

        // invalidate queries
        await queryClient.invalidateQueries({ queryKey: ["schemas"] });
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
      if (id === "create") void router.push(`/admin/schemas`);
    },
    [setIsLoading, id, queryClient],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // reset attributes if type changed
      if (id === "create" && step === 2 && formData.typeId != data.typeId) {
        formData.attributes = [];
      }

      // set form data
      const model = {
        ...formData,
        ...(data as OpportunityRequestBase),
      };
      setFormData(model);

      if (id === "create") {
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
    [id, setStep, formData, setFormData, onSubmit],
  );

  const schemaStep1 = z.object({
    name: z
      .string()
      .min(1, "Schema name is required.")
      .max(255, "Schema name cannot exceed 255 characters."),
    typeId: z
      .string({ required_error: "Schema type is required." })
      .min(1, "Schema type is required."),
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

  // scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const { data: schemaEntities } = useQuery({
    queryKey: ["schemaEntities", formData.typeId],
    queryFn: () =>
      getSchemaEntities(
        SchemaType[
          schemaTypes?.find((x) => x.value == formData.typeId)
            ?.label as keyof typeof SchemaType
        ],
      ),
    enabled: formData.typeId != null && !error,
  });
  const systemSchemaEntities = useMemo(
    () =>
      schemaEntities?.map((x) => ({
        ...x,
        properties: x.properties?.filter((x) => x.system == true),
      })) ?? [],
    [schemaEntities],
  );

  const renderAttribute = useCallback(
    (attributeName: string, index: number) => {
      const schemaEntity = schemaEntities?.find((x) =>
        x.properties?.some((y) => y.attributeName == attributeName),
      );
      const dataSource = schemaEntity?.name;
      const nameDisplay = schemaEntity?.properties?.find(
        (y) => y.attributeName == attributeName,
      )?.nameDisplay;

      return (
        <tr key={`${index}_${attributeName}`}>
          <td>{dataSource}</td>
          <td>{nameDisplay}</td>
        </tr>
      );
    },
    [schemaEntities],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      {isLoading && <Loading />}
      <PageBackground />

      <div className="z-10 container mt-20 max-w-5xl px-2 py-4">
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
                {id == "create" ? "Create" : <>{schema?.displayName}</>}
              </div>
            </li>
          </ul>
        </div>

        <h4 className="pb-2 pl-5 text-white">
          {id == "create" ? "New schema" : schema?.displayName}
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
            {id === "create" && (
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
            <option>Review</option>
          </select>

          {/* forms */}
          <div className="flex grow flex-col items-center rounded-lg bg-white">
            <div className="flex w-full max-w-xl flex-col p-4">
              {step === 1 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">General information</h6>
                    {/* <p className="my-2 text-sm">
                      Information about the opportunity that young people can
                      explore
                    </p> */}
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data),
                    )}
                  >
                    <fieldset className="fieldset">
                      <label className="label">
                        <span className="label-text">Schema name</span>
                      </label>
                      {id === "create" && (
                        <input
                          type="text"
                          className="input border-gray focus:border-gray rounded-md focus:outline-none"
                          placeholder="Enter schema name"
                          {...registerStep1("name")}
                          contentEditable
                        />
                      )}

                      {id !== "create" && (
                        <input
                          type="text"
                          className="input border-gray focus:border-gray rounded-md focus:outline-none"
                          value={schema?.displayName ?? ""}
                          contentEditable
                          disabled={true}
                        />
                      )}

                      {errorsStep1.name && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${errorsStep1.name.message}`}
                          </span>
                        </label>
                      )}

                      {id !== "create" && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            Schema name cannot be changed for existing schemas
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
                            options={schemaTypes}
                            onChange={(val) => onChange(val?.value)}
                            value={schemaTypes?.find((c) => c.value === value)}
                            isDisabled={id !== "create"}
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

                      {id !== "create" && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            Schema type cannot be changed for existing schemas
                          </span>
                        </label>
                      )}
                    </fieldset>

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
                            options={Object.keys(ArtifactType)
                              .filter((key) => isNaN(Number(key)))
                              .map((key) => ({
                                value:
                                  ArtifactType[
                                    key as keyof typeof ArtifactType
                                  ],
                                label: key,
                              }))}
                            onChange={(val) => onChange(val?.value)}
                            value={
                              value != null
                                ? {
                                    value: value,
                                    label: ArtifactType[value as ArtifactType],
                                  }
                                : null
                            }
                            isDisabled={id !== "create"}
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

                      {id !== "create" && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            Artifact type cannot be changed for existing schemas
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      {id === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm grow"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success btn-sm grow"
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
                    {/* <p className="my-2 text-sm">
                      Detailed particulars about the opportunity
                    </p> */}
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data),
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
                        className="btn btn-warning btn-sm grow"
                        onClick={() => {
                          setStep(1);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success btn-sm grow"
                      >
                        {id === "create" ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* only show preview when creating new schema */}
              {step === 3 && id === "create" && (
                <>
                  <div className="mb-2 flex flex-col">
                    <h6 className="font-bold">Review</h6>
                    {/* <p className="my-2 text-sm">
                      Detailed particulars about the opportunity
                    </p> */}
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
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
                        {
                          schemaTypes?.find((x) => x.value == formData.typeId)
                            ?.label
                        }
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
                          Artifact type
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.artifactType != null
                          ? ArtifactType[formData.artifactType as ArtifactType]
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
                        <label className="label">
                          <span className="label-text">System attributes</span>
                        </label>

                        <table className="table w-full">
                          <thead>
                            <tr className="border-gray text-gray-dark">
                              <th className="w-[260px]">Datasource</th>
                              <th>Attribute</th>
                            </tr>
                          </thead>
                          <tbody>
                            {systemSchemaEntities?.map((x) =>
                              ({
                                ...x,
                                properties: x.properties?.filter(
                                  (x) => x.system == true,
                                ),
                              }).properties?.map((attribute, index) => (
                                <>
                                  {renderAttribute(
                                    attribute.attributeName,
                                    index,
                                  )}
                                </>
                              )),
                            ) ?? []}
                          </tbody>
                        </table>

                        <label className="label">
                          <span className="label-text">
                            Additional attributes
                          </span>
                        </label>

                        <table className="table w-full">
                          <thead>
                            <tr className="border-gray text-gray-dark">
                              <th className="w-[260px]">Datasource</th>
                              <th>Attribute</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.attributes?.map((attribute, index) => (
                              <>{renderAttribute(attribute, index)}</>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* <label className="label-text text-sm">
                        <ul>
                          {formData.attributes.map((attr) => (
                            <li key={`review_${attr}`}>{attr}</li>
                          ))}
                        </ul>
                      </label> */}
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
                        className="btn btn-warning btn-sm grow"
                        onClick={() => {
                          setStep(2);
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success btn-sm grow"
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
