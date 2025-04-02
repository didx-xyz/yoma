import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { IoMdImage } from "react-icons/io";
import { type Organization, type UserInfo } from "~/api/models/organisation";
import { AvatarImage } from "~/components/AvatarImage";

export interface InputProps {
  organisation: Organization | undefined;
}

export const VerifyOverview: React.FC<InputProps> = ({ organisation }) => {
  const { data: organisationAdmins } = useQuery<UserInfo[]>({
    queryKey: ["organisationAdmins", organisation?.id],
  });

  return (
    <>
      <div className="flex flex-col gap-2">
        <h5 className="mb-2 pl-1 font-bold">Organisation details</h5>
        {organisation?.name && (
          <fieldset className="fieldset">
            <label className="label">
              <span className="label-text font-semibold">
                Organisation name
              </span>
            </label>
            <label className="label -mt-4">
              <div className="label-text text-gray-dark">
                {organisation?.name}
              </div>
            </label>
          </fieldset>
        )}

        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text font-semibold">Physical address</span>
          </label>
          <label className="label">
            <div className="label-text text-gray-dark -mt-4">
              {organisation?.streetAddress},&nbsp;
              {organisation?.city},&nbsp;
              {organisation?.province},&nbsp;
              {organisation?.country},&nbsp;
              {organisation?.postalCode}
            </div>
          </label>
        </fieldset>

        {organisation?.websiteURL && (
          <fieldset className="fieldset">
            <label className="label">
              <span className="label-text font-semibold">Website URL</span>
            </label>
            <Link
              className="label-text text-green -mt-2 pl-1 underline transition duration-150 ease-in-out"
              href={organisation?.websiteURL}
            >
              {organisation?.websiteURL}
            </Link>
          </fieldset>
        )}

        <div className="my-2 flex min-w-max flex-col items-start justify-start">
          <label className="label">
            <span className="label-text font-semibold">Organisation logo</span>
          </label>
          {/* NO IMAGE */}
          {!organisation?.logoURL && (
            <IoMdImage className="h-20 w-20 text-gray-400" />
          )}

          {/* EXISTING IMAGE */}
          {organisation?.logoURL && (
            <AvatarImage
              alt="company logo"
              size={80}
              icon={organisation.logoURL}
            />
          )}
        </div>

        {organisation?.tagline && (
          <fieldset className="fieldset">
            <label className="label">
              <span className="label-text font-semibold">
                Organisation tagline
              </span>
            </label>
            <label className="label -mt-4">
              <div className="label-text text-gray-dark">
                {organisation?.tagline}
              </div>
            </label>
          </fieldset>
        )}

        {organisation?.biography && (
          <fieldset className="fieldset -mb-1">
            <label className="label">
              <span className="label-text font-semibold">
                Organisation biography
              </span>
            </label>
            <label className="label -mt-4">
              <div className="label-text text-gray-dark">
                {organisation?.biography}
              </div>
            </label>
          </fieldset>
        )}

        <div className="divider bg-gray-light h-[2px]"></div>

        <h5 className="-mb-2 pl-1 font-bold">Organisation roles</h5>
        <fieldset className="fieldset mb-2">
          {organisation?.providerTypes?.map((item) => (
            <label
              htmlFor={item.id}
              className="label justify-normal"
              key={item.id}
            >
              <span className="label-text text-gray-dark -mb-2">
                {item.name} provider
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text font-semibold">
              Company registration documents
            </span>
          </label>

          {/* display list of file links */}
          {organisation?.documents?.map((item) => (
            <Link
              key={item.fileId}
              href={item.url}
              target="_blank"
              className="bg-gray-light text-green my-2 rounded-lg p-4 text-xs"
            >
              {item.originalFileName}
            </Link>
          ))}
        </fieldset>

        <div className="divider bg-gray-light h-[2px]"></div>

        <label className="label -mt-1 -mb-4">
          <span className="label-text font-semibold">
            Organisation admin&#40;s&#41;
          </span>
        </label>
        {organisationAdmins?.map((item) => (
          <fieldset className="fieldset" key={item.id}>
            <label className="label -mb-4">
              <span className="label-text text-gray-dark">
                {item.firstName} {item.surname}
              </span>
            </label>
            <label className="label">
              <div className="label-text text-gray-dark">{item.email}</div>
            </label>
          </fieldset>
        ))}
      </div>
    </>
  );
};
