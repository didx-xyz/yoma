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
import FormMessage, { FormMessageType } from "../Common/FormMessage";
import { validateEmail } from "~/lib/validate";
import { handleUserSignOut } from "~/lib/authUtils";
import FormField from "../Common/FormField";
import FormInput from "../Common/FormInput";

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
  onSubmit?: (userProfile: UserProfile) => void;
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
  const queryClient = useQueryClient();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const setUserProfileAtom = useSetAtom(userProfileAtom);
  const [formData] = useState<
    UserRequestProfile & {
      dateOfBirthDay?: string;
      dateOfBirthMonth?: string;
      dateOfBirthYear?: string;
    }
  >({
    email: userProfile?.email ?? "",
    firstName: userProfile?.firstName ?? "",
    surname: userProfile?.surname ?? "",
    displayName: userProfile?.displayName ?? "",
    phoneNumber: userProfile?.phoneNumber ?? "",
    countryId: userProfile?.countryId ?? "",
    educationId: userProfile?.educationId ?? "",
    genderId: userProfile?.genderId ?? "",
    dateOfBirth: userProfile?.dateOfBirth ?? "",
    dateOfBirthDay: "",
    dateOfBirthMonth: "",
    dateOfBirthYear: "",
    resetPassword: false,
    updatePhoneNumber: false,
  });

  // 👇 use prefetched queries from server (if available)
  const { data: genders, isLoading: isLoadingGenders } = useQuery({
    queryKey: ["genders"],
    queryFn: async () => await getGenders(),
  });
  const { data: countries, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => await getCountries(),
  });
  const { data: educations, isLoading: isLoadingEducations } = useQuery({
    queryKey: ["educations"],
    queryFn: async () => await getEducations(),
  });

  const schema = zod.object({
    email: zod.string().refine(
      (value) => {
        // If userProfile.email exists, email is required and must be valid email
        if (userProfile?.email) {
          return value.length > 0 && validateEmail(value);
        }
        // If userProfile.email does not exist, email is optional
        return true;
      },
      {
        message: "Email is required.",
      },
    ),
    firstName: zod.string().min(1, "First name is required."),
    surname: zod.string().min(1, "Last name is required."),
    displayName: zod.string().optional(),
    // phoneNumber: zod
    //   .string()
    //   .min(1, "Phone number is required.")
    //   .regex(
    //     /^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}$/,
    //     "Phone number is invalid",
    //   ),
    countryId: zod.string().min(1, "Country is required."),
    educationId: zod.string().min(1, "Education is required."),
    genderId: zod.string().min(1, "Gender is required."),
    dateOfBirthDay: zod.string().min(1, "Day is required."),
    dateOfBirthMonth: zod.string().min(1, "Month is required."),
    dateOfBirthYear: zod.string().min(1, "Year is required."),
    dateOfBirth: zod.string().refine(
      (value) => {
        if (!value) return false;
        const date = new Date(value);
        const minDate = new Date("1900/01/01");
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date

        if (isNaN(date.getTime())) {
          return false;
        }
        if (date < minDate) {
          return false;
        }
        if (date > today) {
          return false;
        }
        return true;
      },
      {
        message:
          "Please enter a valid date of birth. Date cannot be in the future or before 1900.",
      },
    ),
    resetPassword: zod.boolean(),
    updatePhoneNumber: zod.boolean(),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, reset, watch, trigger, setValue } =
    form;
  const watchEmail = watch("email");
  const watchUpdatePhoneNumber = watch("updatePhoneNumber");
  const watchResetPassword = watch("resetPassword");
  const watchPhoneNumber = watch("phoneNumber");
  const watchDateOfBirthDay = watch("dateOfBirthDay");
  const watchDateOfBirthMonth = watch("dateOfBirthMonth");
  const watchDateOfBirthYear = watch("dateOfBirthYear");

  // Update the combined dateOfBirth field when individual fields change
  useEffect(() => {
    if (watchDateOfBirthDay && watchDateOfBirthMonth && watchDateOfBirthYear) {
      const combinedDate = `${watchDateOfBirthYear}-${watchDateOfBirthMonth}-${watchDateOfBirthDay}`;
      setValue("dateOfBirth", combinedDate);
      trigger("dateOfBirth");
    } else {
      // Clear dateOfBirth if any field is empty to trigger validation
      setValue("dateOfBirth", "");
      trigger("dateOfBirth");
    }
  }, [
    watchDateOfBirthDay,
    watchDateOfBirthMonth,
    watchDateOfBirthYear,
    setValue,
    trigger,
  ]);

  // set default values
  useEffect(() => {
    if (
      !formData ||
      isLoadingCountries ||
      isLoadingGenders ||
      isLoadingEducations
    ) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    //HACK: no validation on date if value is null
    if (!formData?.dateOfBirth) {
      formData.dateOfBirth = "";
      formData.dateOfBirthDay = "";
      formData.dateOfBirthMonth = "";
      formData.dateOfBirthYear = "";
    }
    //HACK: Parse existing date into separate day, month, year fields
    else if (formData.dateOfBirth != null) {
      const date = new Date(formData.dateOfBirth);
      formData.dateOfBirth = date.toISOString().slice(0, 10);
      formData.dateOfBirthDay = date.getDate().toString().padStart(2, "0");
      formData.dateOfBirthMonth = (date.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      formData.dateOfBirthYear = date.getFullYear().toString();
    }
    //HACK: 'expected string, received null' form validation error
    if (!formData.phoneNumber) formData.phoneNumber = "";
    if (!formData.countryId) formData.countryId = "";
    if (!formData.educationId) formData.educationId = "";
    if (!formData.genderId) formData.genderId = "";

    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset(formData);
      trigger();
    }, 100);
  }, [
    reset,
    trigger,
    formData,
    isLoadingCountries,
    isLoadingGenders,
    isLoadingEducations,
  ]);

  // form submission handler
  const onSubmitHandler = useCallback(
    async (data: FieldValues) => {
      setIsLoading(true);

      try {
        // Combine date fields into a single dateOfBirth field
        if (
          data.dateOfBirthDay &&
          data.dateOfBirthMonth &&
          data.dateOfBirthYear
        ) {
          data.dateOfBirth = `${data.dateOfBirthYear}-${data.dateOfBirthMonth}-${data.dateOfBirthDay}`;
        }

        // Remove the individual date fields from the submission data
        const {
          dateOfBirthDay,
          dateOfBirthMonth,
          dateOfBirthYear,
          ...submissionData
        } = data;

        // update photo
        if (logoFiles && logoFiles.length > 0) {
          await patchPhoto(logoFiles[0]);
        }

        // update api
        const userProfileResult = await patchUser(
          submissionData as UserRequestProfile,
        );

        // update session
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

        // check if sign-in again is required
        const emailUpdated =
          (data.email ?? "").toLowerCase() !==
          (userProfile!.email ?? "").toLowerCase();

        if (emailUpdated || data.updatePhoneNumber || data.resetPassword) {
          // signout from keycloak
          handleUserSignOut(true);
          return;
        }

        // update userProfile Atom (used by NavBar/UserMenu.tsx, refresh profile picture)
        setUserProfileAtom(userProfileResult);

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

        // toast("Your profile has been updated", {
        //   type: "success",
        //   toastId: "patchUserProfile",
        // });

        if (onSubmit) onSubmit(userProfileResult);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "patchUserProfile",
          autoClose: false,
          icon: false,
        });

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
      userProfile,
    ],
  );

  return (
    <>
      {isLoading && <Loading />}

      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="flex flex-col gap-4"
      >
        {filterOptions?.includes(UserProfileFilterOptions.EMAIL) && (
          <>
            <FormField
              label="Email"
              showWarningIcon={!!formState.errors.email?.message}
              showError={
                !!formState.touchedFields.email || formState.isSubmitted
              }
              error={formState.errors.email?.message?.toString()}
            >
              <FormInput
                inputProps={{
                  type: "text",
                  className:
                    "input w-full rounded-md !border-gray !bg-gray-light focus:border-gray focus:outline-none",
                  ...register("email"),
                }}
              />
            </FormField>

            {(watchEmail ?? "").toLowerCase() !==
              (userProfile?.email ?? "") && (
              <div className="mt-2">
                <FormMessage messageType={FormMessageType.Warning}>
                  Updating your email will log you out. Check your email to
                  verify it when you log in again.
                </FormMessage>
              </div>
            )}
          </>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.PHONENUMBER) && (
          <>
            {watchPhoneNumber && (
              <FormField
                label="Phone Number"
                showWarningIcon={!!formState.errors.phoneNumber?.message}
                showError={
                  !!formState.touchedFields.phoneNumber || formState.isSubmitted
                }
                error={formState.errors.phoneNumber?.message?.toString()}
              >
                <FormInput
                  inputProps={{
                    type: "text",
                    className:
                      "input w-full rounded-md border-gray focus:border-gray focus:outline-none disabled:border-gray",
                    ...register("phoneNumber"),
                    disabled: true,
                  }}
                />
              </FormField>
            )}

            <FormField
              label=""
              showWarningIcon={false}
              showError={false}
              error=""
            >
              <label
                htmlFor="updatePhoneNumber"
                className="label w-full cursor-pointer justify-normal"
              >
                <input
                  {...register(`updatePhoneNumber`)}
                  type="checkbox"
                  id="updatePhoneNumber"
                  className="checkbox-primary checkbox"
                />
                <span className="label-text ml-4">Update Phone Number</span>
              </label>
            </FormField>

            {watchUpdatePhoneNumber && (
              <FormMessage messageType={FormMessageType.Warning}>
                You will need to log in again and will be prompted to change
                your phone number.
              </FormMessage>
            )}
          </>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.RESETPASSWORD) && (
          <>
            <FormField
              label="Password"
              showWarningIcon={!!formState.errors.resetPassword?.message}
              showError={
                !!formState.touchedFields.resetPassword || formState.isSubmitted
              }
              error={formState.errors.resetPassword?.message?.toString()}
            >
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
            </FormField>

            {watchResetPassword && (
              <FormMessage messageType={FormMessageType.Warning}>
                You will need to log in again and will be prompted to change
                your password.
              </FormMessage>
            )}
          </>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.FIRSTNAME) && (
          <FormField
            label="First name"
            showWarningIcon={!!formState.errors.firstName?.message}
            showError={
              !!formState.touchedFields.firstName || formState.isSubmitted
            }
            error={formState.errors.firstName?.message?.toString()}
          >
            <FormInput
              inputProps={{
                type: "text",
                className:
                  "input w-full rounded-md border-gray focus:border-gray focus:outline-none",
                ...register("firstName"),
              }}
            />
          </FormField>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.SURNAME) && (
          <FormField
            label="Last name"
            showWarningIcon={!!formState.errors.surname?.message}
            showError={
              !!formState.touchedFields.surname || formState.isSubmitted
            }
            error={formState.errors.surname?.message?.toString()}
          >
            <FormInput
              inputProps={{
                type: "text",
                className:
                  "input w-full rounded-md border-gray focus:border-gray focus:outline-none",
                ...register("surname"),
              }}
            />
          </FormField>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.DISPLAYNAME) && (
          <FormField
            label="Display name"
            showWarningIcon={!!formState.errors.displayName?.message}
            showError={
              !!formState.touchedFields.displayName || formState.isSubmitted
            }
            error={formState.errors.displayName?.message?.toString()}
          >
            <FormInput
              inputProps={{
                type: "text",
                className:
                  "input w-full rounded-md border-gray focus:border-gray focus:outline-none",
                ...register("displayName"),
              }}
            />
          </FormField>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.COUNTRY) && (
          <FormField
            label="Country"
            showWarningIcon={!!formState.errors.countryId?.message}
            showError={
              !!formState.touchedFields.countryId || formState.isSubmitted
            }
            error={formState.errors.countryId?.message?.toString()}
          >
            <select
              className="select border-gray focus:border-gray w-full focus:outline-none"
              {...register("countryId")}
              disabled={isLoadingCountries} // Disable while countries are loading
            >
              <option value="">Please select</option>
              {countries?.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.EDUCATION) && (
          <FormField
            label="Education"
            showWarningIcon={!!formState.errors.educationId?.message}
            showError={
              !!formState.touchedFields.educationId || formState.isSubmitted
            }
            error={formState.errors.educationId?.message?.toString()}
          >
            <select
              className="select border-gray focus:border-gray w-full focus:outline-none"
              {...register("educationId")}
              disabled={isLoadingEducations} // Disable while educations are loading
            >
              <option value="">Please select</option>
              {educations?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.GENDER) && (
          <FormField
            label="Gender"
            showWarningIcon={!!formState.errors.genderId?.message}
            showError={
              !!formState.touchedFields.genderId || formState.isSubmitted
            }
            error={formState.errors.genderId?.message?.toString()}
          >
            <select
              className="select border-gray focus:border-gray w-full focus:outline-none"
              {...register("genderId")}
              disabled={isLoadingGenders} // Disable while genders are loading
            >
              <option value="">Please select</option>
              {genders?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.DATEOFBIRTH) && (
          <FormField
            label="Date of Birth"
            showWarningIcon={
              !!(
                formState.errors.dateOfBirth?.message ||
                formState.errors.dateOfBirthDay?.message ||
                formState.errors.dateOfBirthMonth?.message ||
                formState.errors.dateOfBirthYear?.message
              )
            }
            showError={
              !!(
                formState.touchedFields.dateOfBirth ||
                formState.touchedFields.dateOfBirthDay ||
                formState.touchedFields.dateOfBirthMonth ||
                formState.touchedFields.dateOfBirthYear ||
                formState.isSubmitted
              )
            }
            error={
              formState.errors.dateOfBirth?.message?.toString() ||
              formState.errors.dateOfBirthDay?.message?.toString() ||
              formState.errors.dateOfBirthMonth?.message?.toString() ||
              formState.errors.dateOfBirthYear?.message?.toString()
            }
          >
            <div className="flex gap-2">
              <select
                className="select border-gray focus:border-gray w-full focus:outline-none"
                {...register("dateOfBirthDay")}
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day.toString().padStart(2, "0")}>
                    {day}
                  </option>
                ))}
              </select>
              <select
                className="select border-gray focus:border-gray w-full focus:outline-none"
                {...register("dateOfBirthMonth")}
              >
                <option value="">Month</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((month, index) => (
                  <option
                    key={month}
                    value={(index + 1).toString().padStart(2, "0")}
                  >
                    {month}
                  </option>
                ))}
              </select>
              <select
                className="select border-gray focus:border-gray w-full focus:outline-none"
                {...register("dateOfBirthYear")}
              >
                <option value="">Year</option>
                {Array.from(
                  { length: 100 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </FormField>
        )}

        {filterOptions?.includes(UserProfileFilterOptions.LOGO) && (
          <FormField label="Picture">
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
          </FormField>
        )}

        {/* BUTTONS */}
        <div className="mt-4 flex flex-row items-center justify-center gap-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning w-1/2 shrink normal-case"
              onClick={onCancel}
            >
              {cancelButtonText}
            </button>
          )}

          <button
            type="submit"
            className="btn btn-success w-1/2 shrink normal-case"
          >
            {submitButtonText}
          </button>
        </div>
      </form>
    </>
  );
};
