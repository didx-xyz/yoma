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
import {
  GA_ACTION_USER_PROFILE_UPDATE,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import { useSetAtom } from "jotai";
import { userProfileAtom } from "~/lib/store";
import { Unauthorized } from "~/components/Status/Unauthorized";
import type { NextPageWithLayout } from "~/pages/_app";
import YoIDTabbedLayout from "~/components/Layout/YoIDTabbed";
import { config } from "~/lib/react-query-config";
import { trackGAEvent } from "~/lib/google-analytics";
import AvatarUpload from "~/components/Organisation/Upsert/AvatarUpload";

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
    if (!userProfile) {
      setIsLoading(true);
      return;
    } else {
      setIsLoading(false);
    }

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

      <div className="mb-8 mr-auto mt-2 w-full max-w-2xl px-4">
        <h5 className="mb-4 font-bold tracking-wider">User Settings</h5>
        <div className="flex flex-col items-center">
          <div className="flex w-full flex-col rounded-lg bg-white p-4 md:p-8">
            <form
              onSubmit={handleSubmit(onSubmit)} // eslint-disable-line @typescript-eslint/no-misused-promises
              className="flex flex-col gap-4"
            >
              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-md !border-gray !bg-gray-light focus:border-gray focus:outline-none"
                  disabled
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

                {/* upload image */}
                <AvatarUpload
                  onUploadComplete={(files) => {
                    setLogoFiles(files);
                  }}
                  onRemoveImageExisting={() => {
                    setLogoFiles([]);
                  }}
                  existingImage={userProfile?.photoURL ?? ""}
                  showExisting={
                    userProfile?.photoURL &&
                    !(logoFiles && logoFiles.length > 0)
                      ? true
                      : false
                  }
                />
              </div>

              <div className="form-control">
                <label
                  htmlFor="resetPassword"
                  className="label w-full cursor-pointer justify-normal"
                >
                  <input
                    {...register(`resetPassword`)}
                    type="checkbox"
                    id="resetPassword"
                    className="checkbox-primary checkbox"
                  />
                  <span className="label-text ml-4">Reset Password</span>
                </label>

                {errors.resetPassword && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${errors.resetPassword.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="my-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="btn btn-warning flex-grow"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success flex-grow">
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
