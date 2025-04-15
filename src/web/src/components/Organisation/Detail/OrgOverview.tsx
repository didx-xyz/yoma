import Link from "next/link";
import { IoMdImage } from "react-icons/io";
import { type Organization } from "~/api/models/organisation";
import { AvatarImage } from "~/components/AvatarImage";

export interface InputProps {
  organisation: Organization | undefined;
}

export const OrgOverview: React.FC<InputProps> = ({ organisation }) => {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h6 className="mb-2 font-bold">Organisation Details</h6>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Organisation Name</legend>
          <p className="fieldset-label">{organisation?.name ?? "N/A"}</p>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Physical Address</legend>
          <p className="fieldset-label">
            {organisation?.streetAddress},&nbsp;
            {organisation?.city},&nbsp;
            {organisation?.province},&nbsp;
            {organisation?.country},&nbsp;
            {organisation?.postalCode}
          </p>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Website</legend>
          {organisation?.websiteURL && (
            <Link
              className="link link-secondary"
              href={organisation?.websiteURL}
            >
              {organisation?.websiteURL}
            </Link>
          )}
          {!organisation?.websiteURL && <p className="fieldset-label">N/A</p>}
        </fieldset>

        <div className="my-2 flex min-w-max flex-col items-start justify-start">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Organisation Logo</legend>

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
          </fieldset>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Organisation Tagline</legend>
          <p className="fieldset-label">{organisation?.tagline ?? "N/A"}</p>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Organisation Biography</legend>
          <p className="fieldset-label">{organisation?.biography ?? "N/A"}</p>
        </fieldset>

        <div className="divider" />

        <h6 className="-mb-2 font-bold">Company Registration</h6>

        <fieldset className="fieldset mb-2">
          <legend className="fieldset-legend">Organisation Roles</legend>

          {(organisation?.providerTypes?.length ?? 0) > 0 && (
            <ul>
              {organisation?.providerTypes?.map((item) => (
                <li className="fieldset-label" key={item.id}>
                  {item.name} Provider
                </li>
              ))}
            </ul>
          )}

          {organisation?.providerTypes?.length === 0 && (
            <p className="fieldset-label">N/A</p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Registration Documents</legend>

          {(organisation?.documents?.length ?? 0) > 0 && (
            <>
              {organisation?.documents?.map((item) => (
                <Link
                  key={item.fileId}
                  href={item.url}
                  target="_blank"
                  className="link link-secondary"
                >
                  {item.originalFileName}
                </Link>
              ))}
            </>
          )}
          {organisation?.documents?.length === 0 && (
            <p className="fieldset-label">N/A</p>
          )}
        </fieldset>

        <div className="divider" />

        <h6 className="-mb-2 font-bold">Organisation Administrators</h6>

        <fieldset className="fieldset">
          {(organisation?.administrators?.length ?? 0) > 0 && (
            <ul>
              {organisation?.administrators?.map((item) => (
                <li className="fieldset-label" key={item.id}>
                  {item.firstName} {item.surname} ({item.email})
                </li>
              ))}
            </ul>
          )}
          {organisation?.administrators?.length === 0 && (
            <p className="fieldset-label">N/A</p>
          )}
        </fieldset>
      </div>
    </>
  );
};
