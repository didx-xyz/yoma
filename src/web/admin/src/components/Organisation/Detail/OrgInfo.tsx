/* eslint-disable */
import { type Organization } from "~/api/models/organisation";

export interface InputProps {
  organisation: Organization | undefined;
}

export const OrgInfo: React.FC<InputProps> = ({ organisation }) => {
  return (
    <>
      <form className="flex flex-col gap-2">
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Name</span>
          </label>
          <div className="text-sm">{organisation?.name}</div>
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Address</span>
          </label>
          <div className="text-sm">{organisation?.streetAddress}</div>

          <div className="text-sm">{organisation?.province}</div>

          <div className="text-sm">{organisation?.city}</div>

          <div className="text-sm">{organisation?.postalCode}</div>
        </div>

        {organisation?.websiteURL && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">Website URL</span>
            </label>
            <div className="text-sm">{organisation?.websiteURL}</div>
          </div>
        )}

        {organisation?.tagline && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">Tagline</span>
            </label>
            <div className="text-sm">{organisation?.tagline}</div>
          </div>
        )}

        {organisation?.biography && (
          <div className="form-control">
            <label className="label font-bold">
              <span className="label-text">Biography</span>
            </label>
            <div className="text-sm">{organisation?.biography}</div>
          </div>
        )}
      </form>
    </>
  );
};
