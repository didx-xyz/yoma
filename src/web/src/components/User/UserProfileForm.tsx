import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { type FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import {
  GA_ACTION_USER_PROFILE_UPDATE,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCountries,
  getEducations,
  getGenders,
} from "~/api/services/lookups";
import { captureException } from "@sentry/nextjs";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import type { UserProfile, UserRequestProfile } from "~/api/models/user";
import { patchPhoto, patchUser } from "~/api/services/user";
import { trackGAEvent } from "~/lib/google-analytics";
import AvatarUpload from "../Organisation/Upsert/AvatarUpload";
import { ApiErrors } from "../Status/ApiErrors";
import { useSession } from "next-auth/react";
import { useSetAtom } from "jotai";
import { userProfileAtom } from "~/lib/store";
import { Loading } from "../Status/Loading";

export enum UserProfileFilterOptions {
  EMAIL = "email",
  FIRSTNAME = "firstName",
  SURNAME = "surname",
  DISPLAYNAME = "displayName",
  PHONENUMBER = "phoneNumber",
  COUNTRY = "country",
  EDUCATION = "education",
  GENDER = "gender",
  DATEOFBIRTH = "dateOfBirth",
  RESETPASSWORD = "resetPassword",
  LOGO = "logo",
}

export const UserProfileForm: React.FC<{
  userProfile: UserProfile | null | undefined;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: () => void;
  cancelButtonText?: string;
  submitButtonText?: string;
  filterOptions: UserProfileFilterOptions[];
}> = ({
  userProfile,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
  filterOptions,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const setUserProfileAtom = useSetAtom(userProfileAtom);
  const [formData] = useState<UserRequestProfile>({
    email: userProfile?.email ?? "",
    firstName: userProfile?.firstName ?? "",
    surname: userProfile?.surname ?? "",
    displayName: userProfile?.displayName ?? "",
    phoneNumber: userProfile?.phoneNumber ?? "",
    countryId: userProfile?.countryId ?? "",
    educationId: userProfile?.educationId ?? "",
    genderId: userProfile?.genderId ?? "",
    dateOfBirth: userProfile?.dateOfBirth ?? "",
    resetPassword: false,
  });
  const queryClient = useQueryClient();

  // 👇 use prefetched queries from server (if available)
  const { data: genders } = useQuery({
    queryKey: ["genders"],
    queryFn: async () => await getGenders(),
  });
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => await getCountries(),
  });
  const { data: educations } = useQuery({
    queryKey: ["educations"],
    queryFn: async () => await getEducations(),
  });

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

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, reset } = form;

  // set default values
  useEffect(() => {
    if (!formData) {
      setIsLoading(true);
      return;
    } else {
      setIsLoading(false);
    }

    //HACK: no validation on date if value is null
    if (!formData?.dateOfBirth) {
      formData.dateOfBirth = "";
    }
    //HACK: ISO 8601 date needs to in the YYYY-MM-DD format for the input(type=date) to display correctly
    else if (formData.dateOfBirth != null) {
      const date = new Date(formData.dateOfBirth);
      formData.dateOfBirth = date.toISOString().slice(0, 10);
    }
    //HACK: 'expected string, received null' form validation error
    if (!formData.phoneNumber) formData.phoneNumber = "";
    if (!formData.countryId) formData.countryId = "";
    if (!formData.educationId) formData.educationId = "";
    if (!formData.genderId) formData.genderId = "";

    formData.resetPassword = false;

    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset(formData);
    }, 100);
  }, [reset, formData]);

  const { data: session, update } = useSession();

  // form submission handler
  const onSubmitHandler = useCallback(
    async (data: FieldValues) => {
      setIsLoading(true);

      try {
        // update photo
        if (logoFiles && logoFiles.length > 0) {
          await patchPhoto(logoFiles[0]);
        }

        // update api
        const userProfile = await patchUser(data as UserRequestProfile);

        // update session
        // eslint-disable
        await update({
          ...session,
          user: {
            ...session!.user,
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

        // invalidate queries
        await queryClient.invalidateQueries({
          queryKey: ["userProfile"],
        });
        // (user countries on the oportunity search page)
        if (formData.countryId != data.countryId) {
          await queryClient.invalidateQueries({
            queryKey: ["opportunities", "countries"],
          });
        }

        toast("Your profile has been updated", {
          type: "success",
          toastId: "patchUserProfile",
        });

        if (onSubmit) onSubmit(data);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "patchUserProfile",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }

      setIsLoading(false);
    },
    [
      onSubmit,
      update,
      logoFiles,
      session,
      setIsLoading,
      setUserProfileAtom,
      queryClient,
      formData.countryId,
    ],
  );

  return (
    <>
      {isLoading && <Loading />}

      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-4"
      >
        {filterOptions?.includes(UserProfileFilterOptions.EMAIL) && (
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
            {formState.errors.email && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.email.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.FIRSTNAME) && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">First name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
              {...register("firstName")}
            />
            {formState.errors.firstName && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.firstName.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.SURNAME) && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">Last name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
              {...register("surname")}
            />
            {formState.errors.surname && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.surname.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.DISPLAYNAME) && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">Display name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
              {...register("displayName")}
            />
            {formState.errors.displayName && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.displayName.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.PHONENUMBER) && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">Phone Number</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
              {...register("phoneNumber")}
            />
            {formState.errors.phoneNumber && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.phoneNumber.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.COUNTRY) && (
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
            {formState.errors.countryId && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.countryId.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.EDUCATION) && (
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
            {formState.errors.educationId && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.educationId.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.GENDER) && (
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
            {formState.errors.genderId && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.genderId.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.DATEOFBIRTH) && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">Date of Birth</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
              {...register("dateOfBirth")}
            />
            {formState.errors.dateOfBirth && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.dateOfBirth.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.LOGO) && (
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
                userProfile?.photoURL && !(logoFiles && logoFiles.length > 0)
                  ? true
                  : false
              }
            />
          </div>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.RESETPASSWORD) && (
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

            {formState.errors.resetPassword && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.resetPassword.message}`}
                </span>
              </label>
            )}
          </div>
        )}

        {/* BUTTONS */}
        <div className="mt-4 flex flex-row items-center justify-center gap-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning w-1/2 flex-shrink normal-case md:btn-wide"
              onClick={onCancel}
            >
              {cancelButtonText}
            </button>
          )}

          <button
            type="submit"
            className="btn btn-success w-1/2 flex-shrink normal-case md:btn-wide"
          >
            {submitButtonText}
          </button>
        </div>
      </form>
    </>
  );
};
