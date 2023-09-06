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
import { getCountries, getGenders } from "~/api/services/lookups";
import { getUserProfile, patchUser } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(["genders"], getGenders);
    await queryClient.prefetchQuery(["countries"], getCountries);
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
    },
  };
}

const Settings: NextPageWithLayout<{
  user: User;
}> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  // 👇 use prefetched queries (from server)
  const { data: genders } = useQuery({
    queryKey: ["genders"],
    queryFn: getGenders,
  });
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: getCountries,
  });
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
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
    countryOfResidenceId: zod
      .string()
      .min(1, "Country of residence is required."),
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
    if (!userProfile.countryOfResidenceId)
      userProfile.countryOfResidenceId = "";
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
        // update api
        await patchUser(data as UserProfileRequest);

        // update session
        await update({
          ...user, // eslint-disable-line @typescript-eslint/no-unsafe-member-access
          name: data.displayName, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
          email: data.email, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
          profile: data,
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

      toast("Your profile has been updated", {
        type: "success",
        toastId: "patchUserProfile",
      });
      setIsLoading(false);
    },
    [update, user, setIsLoading],
  );

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container max-w-md">
      {isLoading && <Loading />}
      <h1 className="bold text-center text-2xl">User Settings</h1>
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
            className="input input-bordered w-full"
            {...register("email")}
          />
          {errors.email && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
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
            className="input input-bordered"
            {...register("firstName")}
          />
          {errors.firstName && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
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
            className="input input-bordered"
            {...register("surname")}
          />
          {errors.surname && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
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
            className="input input-bordered"
            {...register("displayName")}
          />
          {errors.displayName && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
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
            className="input input-bordered"
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.phoneNumber.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Country</span>
          </label>
          <select className="select select-bordered" {...register("countryId")}>
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
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.countryId.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Country Of Residence</span>
          </label>
          <select
            className="select select-bordered"
            {...register("countryOfResidenceId")}
          >
            <option value="">Please select</option>
            {countries?.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.countryOfResidenceId && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.countryOfResidenceId.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Gender</span>
          </label>
          <select className="select select-bordered" {...register("genderId")}>
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
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
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
            className="input input-bordered"
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.dateOfBirth.message}`}
              </span>
            </label>
          )}
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
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
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
          <button type="submit" className="btn btn-success btn-sm flex-grow">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(Settings);
