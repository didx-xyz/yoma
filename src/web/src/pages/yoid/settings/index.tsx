import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import router from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import zod from "zod";
import { type UserProfileRequest } from "~/api/models/user";
import {
  getCountries,
  getEducations,
  getGenders,
} from "~/api/services/lookups";
import { getUserProfile, patchPhoto, patchUser } from "~/api/services/user";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { authOptions, type User } from "~/server/auth";
import { FileUploader } from "~/components/Organisation/Upsert/FileUpload";
import {
  ACCEPTED_IMAGE_TYPES,
  GA_ACTION_USER_PROFILE_UPDATE,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import Image from "next/image";
import { useSetAtom } from "jotai";
import { userProfileAtom } from "~/lib/store";
import { Unauthorized } from "~/components/Status/Unauthorized";
import type { NextPageWithLayout } from "~/pages/_app";
import YoIDTabbedLayout from "~/components/Layout/YoIDTabbed";
import { config } from "~/lib/react-query-config";
import { trackGAEvent } from "~/lib/google-analytics";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await Promise.all([
    await queryClient.prefetchQuery({
      queryKey: ["genders"],
      queryFn: async () => await getGenders(),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["countries"],
      queryFn: async () => await getCountries(),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["educations"],
      queryFn: async () => await getEducations(),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["userProfile"],
      queryFn: async () => await getUserProfile(),
    }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

const Settings: NextPageWithLayout<{
  user: User;
  error?: string;
}> = ({ user, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const setUserProfileAtom = useSetAtom(userProfileAtom);
  const { data: session } = useSession();

  // 👇 use prefetched queries from server
  const { data: genders } = useQuery({
    queryKey: ["genders"],
    queryFn: async () => await getGenders(),
    enabled: !error,
  });
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => await getCountries(),
    enabled: !error,
  });
  const { data: educations } = useQuery({
    queryKey: ["educations"],
    queryFn: async () => await getEducations(),
    enabled: !error,
  });
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => await getUserProfile(),
    enabled: !error,
  });

  const { update } = useSession();

  const schema = zod.object({
    email: zod.string().email().min(1, "Email is required."),
    firstName: zod.string().min(1, "First name is required."),
    surname: zod.string().min(1, "Last name is required."),
    displayName: zod.string().min(1, "Display name is required"),
    phoneNumber: zod
      .string()
      .min(1, "Phone number is required.")
      .regex(
        /^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}$/,
        "Phone number is invalid",
      ),
    countryId: zod.string().min(1, "Country is required."),
    educationId: zod.string().min(1, "Education is required."),
    genderId: zod.string().min(1, "Gender is required."),
    dateOfBirth: zod.coerce
      .date({
        required_error: "Date of Birth is required.",
        invalid_type_error: "Date of Birth is required.",
      })
      .min(new Date("1900/01/01"), {
        message: "Date of Birth cannot be that far back in the past.",
      })
      .max(new Date(), { message: "Date of Birth cannot be in the future." }),
    resetPassword: zod.boolean(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // set default values (from user session)
  useEffect(() => {
    if (!userProfile) return;

    //HACK: no validation on date if value is null
    if (!userProfile?.dateOfBirth) {
      userProfile.dateOfBirth = "";
    }
    //HACK: ISO 8601 date needs to in the YYYY-MM-DD format for the input(type=date) to display correctly
    else if (userProfile.dateOfBirth != null) {
      const date = new Date(userProfile.dateOfBirth);
      userProfile.dateOfBirth = date.toISOString().slice(0, 10);
    }
    //HACK: 'expected string, received null' form validation error
    if (!userProfile.phoneNumber) userProfile.phoneNumber = "";
    if (!userProfile.countryId) userProfile.countryId = "";
    if (!userProfile.educationId) userProfile.educationId = "";
    if (!userProfile.genderId) userProfile.genderId = "";

    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset(userProfile);
    }, 100);
  }, [user, reset, userProfile]);

  // form submission handler
  const onSubmit = useCallback(
    async (data: FieldValues) => {
      setIsLoading(true);

      try {
        // update photo
        if (logoFiles && logoFiles.length > 0) {
          await patchPhoto(logoFiles[0]);
        }

        // update api
        const userProfile = await patchUser(data as UserProfileRequest);

        // update session
        // eslint-disable
        await update({
          ...session,
          user: {
            ...user,
            name: data.displayName,
            email: data.email,
            profile: data,
          },
        });
        // eslint-enable

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(GA_CATEGORY_USER, GA_ACTION_USER_PROFILE_UPDATE, "");

        // update userProfile Atom (used by NavBar/UserMenu.tsx, refresh profile picture)
        setUserProfileAtom(userProfile);

        toast("Your profile has been updated", {
          type: "success",
          toastId: "patchUserProfile",
        });
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

      setIsLoading(false);
    },
    [update, user, logoFiles, session, setIsLoading, setUserProfileAtom],
  );

  const handleCancel = () => {
    router.back();
  };

  if (error) return <Unauthorized />;

  return (
    <>
      {isLoading && <Loading />}

      <div className="w-full max-w-2xl px-2 py-4">
        <h2 className="font-boldx pb-8 text-white">User Settings</h2>
        <div className="flex flex-col items-center justify-start">
          <div className="flex w-full flex-col rounded-lg bg-white p-8">
            <form
              onSubmit={handleSubmit(onSubmit)} // eslint-disable-line @typescript-eslint/no-misused-promises
              className="gap-2x flex flex-col"
            >
              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                  {...register("email")}
                />
                {errors.email && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.email.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">First name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.firstName.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Last name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                  {...register("surname")}
                />
                {errors.surname && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.surname.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Display name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                  {...register("displayName")}
                />
                {errors.displayName && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.displayName.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Phone Number</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                  {...register("phoneNumber")}
                />
                {errors.phoneNumber && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.phoneNumber.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Country</span>
                </label>
                <select
                  className="select select-bordered border-gray focus:border-gray focus:outline-none"
                  {...register("countryId")}
                >
                  <option value="">Please select</option>
                  {countries?.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.countryId && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.countryId.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Education</span>
                </label>
                <select
                  className="select select-bordered border-gray focus:border-gray focus:outline-none"
                  {...register("educationId")}
                >
                  <option value="">Please select</option>
                  {educations?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {errors.educationId && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.educationId.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Gender</span>
                </label>
                <select
                  className="select select-bordered border-gray focus:border-gray focus:outline-none"
                  {...register("genderId")}
                >
                  <option value="">Please select</option>
                  {genders?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {errors.genderId && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.genderId.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Date of Birth</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.dateOfBirth.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Picture</span>
                </label>

                {/* existing image */}
                <div className="flex items-center justify-center pb-4">
                  {/* NO IMAGE */}
                  {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                  {/* {!logoExisting && <IoMdImage className="h-12 w-12 rounded-lg" />} */}
                  {/* EXISTING IMAGE */}
                  {userProfile?.photoURL &&
                    !(logoFiles && logoFiles.length > 0) && (
                      <div className="indicator">
                        {/* <button
                      className="filepond--file-action-button filepond--action-remove-item badge indicator-item badge-secondary"
                      type="button"
                      data-align="left"
                      //onClick={onRemoveLogoExisting}
                    >
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 26 26"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.586 13l-2.293 2.293a1 1 0 0 0 1.414 1.414L13 14.414l2.293 2.293a1 1 0 0 0 1.414-1.414L14.414 13l2.293-2.293a1 1 0 0 0-1.414-1.414L13 11.586l-2.293-2.293a1 1 0 0 0-1.414 1.414L11.586 13z"
                          fill="currentColor"
                          fillRule="nonzero"
                        ></path>
                      </svg>
                      <span>Remove</span>
                    </button> */}

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <Image
                          className="rounded-lg object-contain shadow-lg"
                          alt="user picture"
                          width={100}
                          height={100}
                          style={{ width: 100, height: 100 }}
                          src={userProfile.photoURL}
                        />
                      </div>
                    )}
                </div>

                {/* upload image */}
                <FileUploader
                  name="logo"
                  files={logoFiles as any}
                  allowMultiple={false}
                  fileTypes={ACCEPTED_IMAGE_TYPES}
                  onUploadComplete={(files) => {
                    setLogoFiles(files);
                  }}
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Reset Password</span>
                  <input
                    type="checkbox"
                    className="checkbox mr-2"
                    {...register("resetPassword")}
                  />
                </label>
                {errors.resetPassword && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.resetPassword.message}`}
                    </span>
                  </label>
                )}
              </div>

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
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbedLayout>{page}</YoIDTabbedLayout>;
};

export default Settings;
