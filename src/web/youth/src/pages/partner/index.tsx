import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { IoMdImage } from "react-icons/io";
import { toast } from "react-toastify";
import zod from "zod";
import {
  type OrganizationProviderType,
  type OrganizationRequest,
} from "~/api/models/organisation";
import {
  getOrganisationProviderTypes,
  postOrganisation,
} from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "~/lib/constants";
import withAuth from "~/context/withAuth";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(["organisationProviderTypes"], () =>
      getOrganisationProviderTypes(context),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
    },
  };
}

const RegisterOrganisation: NextPageWithLayout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // 👇 use prefetched queries (from server)
  const { data: organisationProviderTypes } = useQuery<
    OrganizationProviderType[]
  >({
    queryKey: ["organisationProviderTypes"],
    queryFn: () => getOrganisationProviderTypes(),
  });

  const schemaStep1 = zod.object({
    name: zod
      .string()
      .min(1, "Organisation name is required.")
      .max(80, "Maximum of 80 characters allowed."),
    streetAddress: zod.string().min(1, "Street address is required."),
    province: zod.string().min(1, "Province is required."),
    city: zod.string().min(1, "City is required."),
    postalCode: zod.string().min(1, "Postal code is required."),
    websiteURL: zod
      .string()
      .url("Organisation website URL is invalid.")
      .min(2, "Organisation website URL is required.")
      .max(2083, "Organisation website URL cannot exceed 2083 characters."),
    logo: zod
      .any()
      .refine((files: File[]) => files?.length == 1, "Logo is required.")
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_FILE_SIZE,
        `Max file size is 5MB.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        ".jpg, .jpeg, .png and .webp files are accepted.",
      ),
    tagline: zod
      .string()
      .max(160, "Maximum of 160 characters allowed.")
      .nullish()
      .optional(),
    biography: zod
      .string()
      .max(480, "Maximum of 480 characters allowed.")
      .nullish()
      .optional(),
  });

  /*  name: string;
  websiteURL: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  vATIN: string | null;
  taxNumber: string | null;
  registrationNumber: string | null;
  city: string | null;
  countryId: string | null;
  streetAddress: string | null;
  province: string | null;
  postalCode: string | null;
  tagline: string | null;
  biography: string | null;*/
  const schemaStep2 = zod.object({
    providerTypes: zod
      .array(zod.string())
      .min(1, "Please select at least one option."),
    registrationDocument: zod
      .any()
      .refine(
        (files: File[]) => files?.length == 1,
        "Registration document is required.",
      )
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_FILE_SIZE,
        `Max file size is 5MB.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_DOC_TYPES.includes(files?.[0]?.type),
        ".pdf, .doc and .docx files are accepted.",
      ),
    educationProviderDocument: zod
      .any()
      .refine(
        (files: File[]) => files?.length == 1,
        "Education provider document is required.",
      )
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_FILE_SIZE,
        `Max file size is 5MB.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_DOC_TYPES.includes(files?.[0]?.type),
        ".pdf, .doc and .docx files are accepted.",
      ),
    vatBusinessDocument: zod
      .any()
      .refine(
        (files: File[]) => files?.length == 1,
        "VAT/Business document is required.",
      )
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_FILE_SIZE,
        `Max file size is 5MB.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_DOC_TYPES.includes(files?.[0]?.type),
        ".pdf, .doc and .docx files are accepted.",
      ),
  });

  const schemaStep3 = zod.object({
    iamOrganisationAdmin: zod.boolean(),
    additionalAdmins: zod.array(zod.string()),
  });

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm({
    resolver: zodResolver(schemaStep1),
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
  } = useForm({
    resolver: zodResolver(schemaStep2),
  });

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: { errors: errorsStep3 },
  } = useForm({
    resolver: zodResolver(schemaStep3),
  });

  // set default values (from user session)
  // useEffect(() => {
  //   //HACK: no validation on date if value is null
  //   if (!user?.profile.dateOfBirth) {
  //     user.profile.dateOfBirth = "";
  //   }
  //   //HACK: ISO 8601 date needs to in the YYYY-MM-DD format for the input(type=date) to display correctly
  //   else if (user?.profile.dateOfBirth != null) {
  //     const date = new Date(user.profile.dateOfBirth);
  //     user.profile.dateOfBirth = date.toISOString().slice(0, 10);
  //   }
  //   //HACK: 'expected string, received null' form validation error
  //   if (!user?.profile.phoneNumber) {
  //     user.profile.phoneNumber = "";
  //   }

  //   // reset form
  //   // setTimeout is needed to prevent the form from being reset before the default values are set
  //   setTimeout(() => {
  //     reset(user.profile);
  //   }, 100);
  // }, [user, reset]);

  // form submission handler
  const onSubmitStep1 = useCallback(
    (data: FieldValues) => {
      setStep(2);
    },
    [setStep],
  );
  const onSubmitStep2 = useCallback(
    (data: FieldValues) => {
      setStep(2);
    },
    [setStep],
  );
  const onSubmitStep3 = useCallback(
    (data: FieldValues) => {
      setStep(2);
    },
    [setStep],
  );

  const onSubmit = useCallback(
    async (data: FieldValues) => {
      setIsLoading(true);

      try {
        // update api
        await postOrganisation(data as OrganizationRequest);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "patchUserProfileError",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }

      toast("Your profile has been updated", {
        type: "success",
        toastId: "patchUserProfile",
      });
      setIsLoading(false);
    },
    [setIsLoading],
  );

  const handleCancel = () => {
    router.back();
  };

  //* LOGO IMAGE
  const [imageLogo, setImageLogo] = useState<File>();
  const [createObjectURLLogo, setCreateObjectURLLogo] = useState<string>("");

  const uploadToClientLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (event.target.files && event.target.files[0]) {
      const i = event.target.files[0];

      setImageLogo(i);
      setCreateObjectURLLogo(URL.createObjectURL(i));
    }
  };
  //* LOGO IMAGE

  return (
    <div className="container max-w-md">
      {isLoading && <Loading />}

      {step == 1 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step step-success"></li>
            <li className="step"></li>
            <li className="step"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Organisation details</h2>
            <p className="my-2">General organisation information</p>
          </div>

          <form
            onSubmit={handleSubmitStep1(onSubmitStep1)} // eslint-disable-line @typescript-eslint/no-misused-promises
            className="flex flex-col gap-2"
          >
            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Organisation name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation name"
                {...registerStep1("name")}
              />
              {errorsStep1.name && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.name.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Street address</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Your organisation's street address"
                {...registerStep1("streetAddress")}
              />
              {errorsStep1.streetAddress && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.streetAddress.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Province</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation's province/state"
                {...registerStep1("province")}
              />
              {errorsStep1.province && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.province.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">City</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation's city/town"
                {...registerStep1("city")}
              />
              {errorsStep1.city && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.city.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Postal code</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation's postal code/zip"
                {...registerStep1("postalCode")}
              />
              {errorsStep1.postalCode && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.postalCode.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Organisation website URL</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="www.website.com"
                {...registerStep1("websiteURL")}
              />
              {errorsStep1.websiteURL && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.websiteURL.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Logo</span>
              </label>

              <div className="flex items-center justify-center pb-4">
                {/* NO IMAGE */}
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                {!createObjectURLLogo && (
                  <IoMdImage className="h-12 w-12 rounded-lg" />
                )}

                {/* UPLOADED IMAGE */}
                {createObjectURLLogo && (
                  <>
                    {/* eslint-disable */}
                    <img
                      className="rounded-lg shadow-lg"
                      alt="user logo"
                      width={75}
                      height={75}
                      src={createObjectURLLogo}
                    />
                    {/* eslint-enable */}
                  </>
                )}
              </div>

              {/* CHOOSE IMAGE */}
              <input
                type="file"
                className="file-input file-input-bordered file-input-primary file-input-sm w-full"
                {...registerStep1("logo")}
                onChange={uploadToClientLogo}
              />

              {errorsStep1.logo && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.logo.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Organisation tagline</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation tagline"
                {...registerStep1("tagline")}
              />
              {errorsStep1.tagline && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.tagline.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Organisation biography</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Your organisation biography"
                {...registerStep1("biography")}
              />
              {errorsStep1.biography && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.biography.message}`}
                  </span>
                </label>
              )}
            </div>

            {/* BUTTONS */}
            <div className="my-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm flex-grow"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success btn-sm flex-grow"
              >
                Next
              </button>
            </div>
          </form>
        </>
      )}

      {step == 2 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step"></li>
            <li className="step step-success"></li>
            <li className="step"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Organisation roles</h2>
            {/* <p className="my-2">What role will your organisation play within Yoma?</p> */}
          </div>

          <form
            onSubmit={handleSubmitStep2(onSubmitStep2)} // eslint-disable-line @typescript-eslint/no-misused-promises
            className="gap-2x flex flex-col"
          >
            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">
                  What role will your organisation play within Yoma?
                </span>
              </label>
              {organisationProviderTypes?.map((item) => (
                <label
                  htmlFor={item.id}
                  className="label cursor-pointer justify-normal"
                  key={item.id}
                >
                  <input
                    {...registerStep2("providerTypes")}
                    type="checkbox"
                    value={item.id}
                    id={item.id}
                    name="providerTypes"
                    className="checkbox-primary checkbox"
                  />
                  <span className="label-text ml-4">{item.name}</span>
                </label>
              ))}

              {errorsStep2.providerTypes && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep2.providerTypes.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">
                  Organisation registration document
                </span>
              </label>
              {/* <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Your organisation's street address"
                {...registerStep2("streetAddress")}
              /> */}
              {errorsStep2.registrationDocument && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep2.registrationDocument.message}`}
                  </span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Province</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation's province/state"
                {...registerStep2("province")}
              />
              {errorsStep2.province && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep2.province.message}`}
                  </span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">City</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation's city/town"
                {...registerStep2("city")}
              />
              {errorsStep2.city && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep2.city.message}`}
                  </span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Postal code</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your organisation's postal code/zip"
                {...registerStep2("postalCode")}
              />
              {errorsStep2.postalCode && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep2.postalCode.message}`}
                  </span>
                </label>
              )}
            </div>

            {/* BUTTONS */}
            <div className="my-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button type="submit" className="btn btn-success btn-sm">
                Next
              </button>
            </div>
          </form>
        </>
      )}

      {step == 3 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step"></li>
            <li className="step"></li>
            <li className="step step-success"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Organisation details</h2>
            <p className="my-2">General organisation information</p>
          </div>

          <form
            onSubmit={handleSubmitStep3(onSubmitStep3)} // eslint-disable-line @typescript-eslint/no-misused-promises
            className="gap-2x flex flex-col"
          >
            {/* BUTTONS */}
            <div className="my-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm"
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button type="submit" className="btn btn-success btn-sm w-full">
                Next
              </button>
            </div>
          </form>
        </>
      )}

      {/* <ul className="steps steps-vertical lg:steps-horizontal">
        <li className="step step-primary">Register</li>
        <li className="step step-primary">Choose plan</li>
        <li className="step">Purchase</li>
        <li className="step">Receive Product</li>
      </ul> */}
    </div>
  );
};

RegisterOrganisation.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(RegisterOrganisation);
