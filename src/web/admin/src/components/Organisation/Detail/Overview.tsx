import Link from "next/link";
import { IoMdImage } from "react-icons/io";
import { type Organization } from "~/api/models/organisation";
import { OrgAdmins } from "./OrgAdmins";
import { OrgInfo } from "./OrgInfo";
import { OrgRoles } from "./OrgRoles";

export interface InputProps {
  organisation: Organization | undefined;
}

export const Overview: React.FC<InputProps> = ({ organisation }) => {
  return (
    <>
      <div className="flex flex-col gap-2">
        {/* <div className="flex flex-col text-center">
          <h2>Organisation General</h2>
        </div> */}

        <div className="flex flex-row gap-2 rounded-lg border p-2 shadow-lg">
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
          <div className="flex max-w-sm flex-col gap-1 truncate text-ellipsis text-center">
            <h4 className="text-sm">{organisation?.name}</h4>
            {organisation?.websiteURL && (
              <Link
                className="primary flex text-xs"
                href={organisation.websiteURL}
              >
                {organisation.websiteURL}
              </Link>
            )}
            {organisation?.tagline && (
              <div className="flex text-center text-xs">
                {organisation.tagline}
              </div>
            )}
            {organisation?.biography && (
              <div className="flex text-center text-xs">
                {organisation.biography}
              </div>
            )}
          </div>
        </div>

        <div className="divider"></div>

        <OrgInfo organisation={organisation} />

        <div className="flex flex-col text-center">
          <div className="divider"></div>
          <h2>Roles</h2>
          <div className="divider"></div>
        </div>

        <OrgRoles organisation={organisation} />

        <div className="flex flex-col text-center">
          <div className="divider"></div>
          <h2>Admins</h2>
          <div className="divider"></div>
        </div>
        <OrgAdmins organisation={organisation} />
      </div>
    </>
  );
};
