/* eslint-disable */
import Link from "next/link";
import { IoMdImage } from "react-icons/io";
import { type Organization } from "~/api/models/organisation";

export interface InputProps {
  organisation: Organization | undefined;
}

export const OrgInfo: React.FC<InputProps> = ({ organisation }) => {
  return (
    <>
      <form className="flex flex-col gap-2">
        <h4>{organisation?.name}</h4>

        {organisation?.websiteURL && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Company website</span>
            </label>
            <Link className="text-sm" href={organisation?.websiteURL}>
              {organisation?.websiteURL}
            </Link>
          </div>
        )}

        <div className="divider"></div>

        <h4>Logo</h4>

        <div className="flex min-w-max items-center justify-center">
          {/* NO IMAGE */}
          {!organisation?.logoURL && (
            <IoMdImage className="text-gray-400 h-20 w-20" />
          )}

          {/* EXISTING IMAGE */}
          {organisation?.logoURL && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="rounded-lg"
                alt="company logo"
                width={80}
                height={80}
                src={organisation.logoURL}
              />
            </>
          )}
        </div>

        <div className="divider"></div>

        <h4>Company details</h4>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Address</span>
          </label>
          <div className="text-sm">{organisation?.streetAddress}</div>

          <div className="text-sm">{organisation?.province}</div>

          <div className="text-sm">{organisation?.city}</div>

          <div className="text-sm">{organisation?.postalCode}</div>
        </div>

        {organisation?.tagline && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tagline</span>
            </label>
            <div className="text-sm">{organisation?.tagline}</div>
          </div>
        )}

        {organisation?.biography && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Biography</span>
            </label>
            <div className="text-sm">{organisation?.biography}</div>
          </div>
        )}
      </form>
    </>
  );
};
