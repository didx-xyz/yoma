import Link from "next/link";
import { type Organization } from "~/api/models/organisation";

export interface InputProps {
  organisation: Organization | undefined;
}

export const OrgRoles: React.FC<InputProps> = ({ organisation }) => {
  return (
    <>
      <form className="flex flex-col gap-2">
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">
              What role will your organisation play within Yoma?
            </span>
          </label>
          {organisation?.providerTypes?.map((item) => (
            <label
              htmlFor={item.id}
              className="label cursor-pointer justify-normal"
              key={item.id}
            >
              <span className="label-text ml-4">{item.name}</span>
            </label>
          ))}
        </div>
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Documents</span>
          </label>

          {/* display list of file links */}
          {organisation?.documents?.map((item) => (
            <Link key={item.fileId} href={item.url} target="_blank">
              {item.originalFileName}
            </Link>
          ))}
        </div>
      </form>
    </>
  );
};
