import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
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
  useMemo,
  useState,
  type ReactElement,
  useEffect,
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Controller,
  useForm,
  type FieldValues,
  useFieldArray,
} from "react-hook-form";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import z from "zod";
import { type SelectOption } from "~/api/models/lookups";
import {
  VerificationMethod,
  type Opportunity,
  type OpportunityRequestBase,
  type OpportunityVerificationType,
} from "~/api/models/opportunity";
import {
  getCountries,
  getLanguages,
  getSkills,
  getTimeIntervals,
} from "~/api/services/lookups";
import {
  updateOpportunity,
  getDifficulties,
  getOpportunityById,
  getTypes,
  getVerificationTypes,
  createOpportunity,
  getCategories,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoMdArrowRoundBack } from "react-icons/io";
import CreatableSelect from "react-select/creatable";
import type { NextPageWithLayout } from "~/pages/_app";
import {
  createSchema,
  getSchemaEntities,
  getSchemas,
} from "~/api/services/credentials";
import {
  ArtifactType,
  SSISchema,
  SSISchemaRequest,
} from "~/api/models/credential";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const queryClient = new QueryClient();
  const session = await getServerSession(context.req, context.res, authOptions);

  // UND_ERR_HEADERS_OVERFLOW ISSUE: disable prefetching for now
  //   await queryClient.prefetchQuery(["schemaEntities"], async () =>
  //   (await getSchemaEntities(context)).map((c) => ({
  //     value: c.id,
  //     label: c.name,
  //   })),
  // );

  // if (id !== "create") {
  //   await queryClient.prefetchQuery(["schema", id], () =>
  //     getSchemaById(id, context),
  //   );
  // }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
    },
  };
}

const SchemaCreateEdit: NextPageWithLayout<{
  id: string;
  user: User;
}> = ({ id }) => {
  const queryClient = useQueryClient();

  const { data: schemaEntities } = useQuery<SelectOption[]>({
    queryKey: ["schemaEntities"],
    queryFn: async () =>
      (await getSchemaEntities()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });

  // const { data: schema } = useQuery<Opportunity>({
  //   queryKey: ["opportunity", id],
  //   queryFn: () => getOpportunityById(id),
  //   enabled: id !== "create",
  // });

  const schema = useState<SSISchema | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    void router.push(`/admin/schemas`);
  };

  const [formData, setFormData] = useState<SSISchemaRequest>({
    name: "",
    artifactType: null,
    attributes: [],
  });

  const onSubmit = useCallback(
    async (data: SSISchemaRequest) => {
      //return;
      setIsLoading(true);

      try {
        // update api
        await createSchema(data);
        toast("Schema created.", {
          type: "success",
          toastId: "schema",
        });

        // invalidate queries
        await queryClient.invalidateQueries(["schemas"]);
        await queryClient.invalidateQueries(["schema", id]);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "schema",
          autoClose: false,
          icon: false,
        });

        captureException(error);
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
      // set form data
      const model = {
        ...formData,
        ...(data as OpportunityRequestBase),
      };
      setFormData(model);

      console.log("model", model);

      if (id === "create") {
        if (step === 4) {
          // submit on last page when creating new schema
          await onSubmit(model);
          return;
        }
      } else {
        // submit on each page when updating schema
        await onSubmit(model);
        return;
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
  });

  const schemaStep2 = z.object({
    schemaEntityId: z.string().optional(),
    attributes: z
      .array(z.string(), { required_error: "Attribute is required" })
      .min(1, "Attribute is required."),
  });

  const schemaStep3 = z.object({
    artifactType: z.union([z.number(), z.null()]).optional(),
  });

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    setValue: setValueStep1,
    formState: { errors: errorsStep1, isValid: isValidStep1 },
    control: controlStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    getValues: getValuesStep2,
    setValue: setValueStep2,
    formState: { errors: errorsStep2, isValid: isValidStep2 },
    control: controlStep2,
    watch: watchStep2,
    reset: resetStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
  });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: controlStep2,
      name: "attributes",
    },
  );

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: { errors: errorsStep3, isValid: isValidStep3 },
    control: controlStep3,
  } = useForm({
    resolver: zodResolver(schemaStep3),
    defaultValues: formData,
  });

  // scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  return (
    <>
      {isLoading && <Loading />}
      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-4">
        {/* BREADCRUMB */}
        <div
          //className="flex flex-row text-xs text-gray"
          className="breadcrumbs text-sm"
        >
          <ul>
            <li>
              <Link
                className="font-bold text-white hover:text-gray"
                href={`/admin/schemas`}
              >
                <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
                Schemas
              </Link>
            </li>
            <li>
              <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
                {id == "create" ? (
                  "Create"
                ) : (
                  <Link
                    className="text-white hover:text-gray"
                    href={`/organisations/${id}/opportunities/${id}/info`}
                  >
                    {schema?.name}
                  </Link>
                )}
              </div>
            </li>
          </ul>
        </div>

        <h4 className="pb-2 pl-5 text-white">
          {id == "create" ? "New schema" : schema?.name}
        </h4>

        <div className="flex flex-col gap-2 md:flex-row">
          {/* left vertical menu */}
          <ul className="menu hidden w-64 gap-2 rounded-lg bg-base-200 font-semibold md:flex">
            <li onClick={() => setStep(1)}>
              <a
                className={`menu-title ${
                  step === 1
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep1 ? "bg- bg-green" : "bg-gray-dark"
                  }`}
                >
                  1
                </span>
                General information
              </a>
            </li>
            <li onClick={() => setStep(2)}>
              <a
                className={`menu-title ${
                  step === 2
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep2 ? "bg- bg-green" : "bg-gray-dark"
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
                  className={`menu-title ${
                    step === 3
                      ? "bg-green-light text-green hover:bg-green-light"
                      : "bg-gray text-gray-dark"
                  }`}
                >
                  <span
                    className={`mr-2 rounded-full bg-gray-dark px-1.5 py-0.5 text-xs font-medium text-white ${
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
            className="select select-bordered select-sm md:hidden"
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
          <div className="flex flex-grow flex-col items-center rounded-lg bg-white">
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
                    )} // eslint-disable-line @typescript-eslint/no-misused-promises
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Schema name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered rounded-md"
                        placeholder="Enter schema name"
                        {...registerStep1("name")}
                        contentEditable
                      />
                      {errorsStep1.name && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.name.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      {id === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm flex-grow"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success btn-sm flex-grow"
                      >
                        {id === "create" ? "Next" : "Submit"}
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
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Data source</span>
                      </label>
                      {/* <Controller
                        control={controlStep2}
                        name="schemaEntityId"
                        render={({ field: { onChange, value } }) => ( */}
                      <Select
                        classNames={{
                          control: () => "input input-bordered",
                        }}
                        isMulti={false}
                        options={schemaEntities}
                        onChange={(val) => {
                          // clear all the attributes (fields)
                          resetStep2({ attributes: [] });

                          // add selected schema entity attributes
                          // to the attributes (fields) array
                          append(val?.label);
                        }}
                        // value={schemaEntities?.filter(
                        //   (c) => value?.includes(c.value),
                        // )}
                      />
                      {/* )}
                      /> */}

                      {errorsStep2.attributes && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${errorsStep2.attributes.message}`}
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Attributes included</span>
                      </label>

                      {/* render each of the attributes (fields) with delete & add button */}
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex flex-row items-center gap-2"
                        >
                          <input
                            type="text"
                            className="input input-bordered rounded-md"
                            placeholder="Enter attribute name"
                            {...registerStep2(`attributes.${index}`)}
                            contentEditable
                          />
                          <button
                            type="button"
                            className="btn btn-error btn-sm"
                            onClick={() => remove(index)}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => append({})}
                      >
                        Add
                      </button>

                      {/* add new attribute (field) */}

                      {errorsStep2.attributes && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${errorsStep2.attributes.message}`}
                          </span>
                        </label>
                      )}
                    </div>
                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      {id === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm flex-grow"
                          onClick={() => {
                            setStep(1);
                          }}
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success btn-sm flex-grow"
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
                  <div className="flex flex-col">
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
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Schema name
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.name}
                      </label>
                      {errorsStep1.name && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.name.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">Attributes</span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.attributes?.join(", ")}
                      </label>
                      {errorsStep1.attributes && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.attributes.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Artifact type
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.artifactType}
                      </label>
                      {errorsStep2.difficultyId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.difficultyId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm flex-grow"
                        onClick={() => {
                          setStep(6);
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success btn-sm flex-grow"
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

export default withAuth(SchemaCreateEdit);
