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
          <div className="form-control">
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
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Physical address</span>
          </label>
          <label className="label">
            <div className="label-text -mt-4 text-gray-dark">
              {organisation?.streetAddress},&nbsp;
              {organisation?.city},&nbsp;
              {organisation?.province},&nbsp;
              {organisation?.country},&nbsp;
              {organisation?.postalCode}
            </div>
          </label>
        </div>

        {organisation?.websiteURL && (
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Website URL</span>
            </label>
            <Link
              className="label-text -mt-2 pl-1 text-green underline transition duration-150 ease-in-out"
              href={organisation?.websiteURL}
            >
              {organisation?.websiteURL}
            </Link>
          </div>
        )}

        <div className="my-2 flex min-w-max flex-col items-start justify-start">
          <label className="label">
            <span className="label-text font-semibold">Organisation logo</span>
          </label>
          {/* NO IMAGE */}
          {!organisation?.logoURL && (
            <IoMdImage className="text-gray-400 h-20 w-20" />
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
          <div className="form-control">
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
          </div>
        )}

        {organisation?.biography && (
          <div className="form-control -mb-1">
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
          </div>
        )}

        <div className="divider h-[2px] bg-gray-light"></div>

        <h5 className="-mb-2 pl-1 font-bold">Organisation roles</h5>
        <div className="form-control mb-2">
          {organisation?.providerTypes?.map((item) => (
            <label
              htmlFor={item.id}
              className="label justify-normal"
              key={item.id}
            >
              <span className="label-text -mb-2 text-gray-dark">
                {item.name} provider
              </span>
            </label>
          ))}
        </div>

        <div className="form-control">
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
              className="my-2 rounded-lg bg-gray-light p-4 text-xs text-green"
            >
              {item.originalFileName}
            </Link>
          ))}
        </div>

        <div className="divider h-[2px] bg-gray-light"></div>

        <label className="label -mb-4 -mt-1">
          <span className="label-text font-semibold">
            Organisation admin&#40;s&#41;
          </span>
        </label>
        {organisationAdmins?.map((item) => (
          <div key={item.id} className="form-control">
            <label className="label -mb-4">
              <span className="label-text text-gray-dark">
                {item.firstName} {item.surname}
              </span>
            </label>
            <label className="label">
              <div className="label-text text-gray-dark">{item.email}</div>
            </label>
          </div>
        ))}
      </div>
    </>
  );
};
