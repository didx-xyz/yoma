import { type Organization } from "~/api/models/organisation";

export interface InputProps {
  organisation: Organization | undefined;
}

export const OrgAdmins: React.FC<InputProps> = ({ organisation }) => {
  return (
    <>
      <form className="flex flex-col gap-2">
        <div className="form-control">
          <label className="label cursor-pointer font-bold">
            <span className="label-text">I will be the organisation admin</span>
            <input type="checkbox" className="checkbox-primary checkbox" />
          </label>
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Add additional admins</span>
          </label>
        </div>
      </form>
    </>
  );
};
