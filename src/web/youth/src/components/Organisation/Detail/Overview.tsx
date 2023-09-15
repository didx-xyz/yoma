import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { IoMdImage } from "react-icons/io";
import { type Organization, type UserInfo } from "~/api/models/organisation";

export interface InputProps {
  organisation: Organization | undefined;
}

export const Overview: React.FC<InputProps> = ({ organisation }) => {
  const { data: organisationAdmins } = useQuery<UserInfo[]>({
    queryKey: ["organisationAdmins", organisation?.id],
  });

  return (
    <>
      <div className="flex flex-col gap-2">
        {organisation?.name && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Company name</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.name}</div>
            </label>
          </div>
        )}

        {organisation?.websiteURL && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Company website</span>
            </label>
            <Link
              className="hover:text-success-600 focus:text-success-600 active:text-success-700 pl-1 text-success transition duration-150 ease-in-out"
              href={organisation?.websiteURL}
            >
              {organisation?.websiteURL}
            </Link>
          </div>
        )}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">
              Interested in becoming
            </span>
          </label>
          {organisation?.providerTypes?.map((item) => (
            <label
              htmlFor={item.id}
              className="label justify-normal"
              key={item.id}
            >
              <span className="label-text">{item.name}</span>
            </label>
          ))}
        </div>

        <div className="divider"></div>

        <h5>Logo</h5>

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
                width={150}
                height={1500}
                src={organisation.logoURL}
              />
            </>
          )}
        </div>

        <div className="divider"></div>

        <h4>Company details</h4>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">Address</span>
          </label>
          <label className="label">
            <div className="label-text">
              {organisation?.streetAddress} {organisation?.province}{" "}
              {organisation?.city} {organisation?.postalCode}
            </div>
          </label>
        </div>

        {organisation?.tagline && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Tagline</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.tagline}</div>
            </label>
          </div>
        )}

        {organisation?.biography && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Biography</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.biography}</div>
            </label>
          </div>
        )}
        <div className="divider"></div>
        <h5>Company registration</h5>
        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">Documents</span>
          </label>

          {/* display list of file links */}
          {organisation?.documents?.map((item) => (
            <Link
              key={item.fileId}
              href={item.url}
              target="_blank"
              className="label"
            >
              {item.originalFileName}
            </Link>
          ))}
        </div>
        {organisation?.primaryContactName && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Contact person</span>
            </label>
            <div className="text-sm">{organisation?.primaryContactName}</div>
          </div>
        )}
        {organisation?.primaryContactEmail && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Contact email</span>
            </label>
            <div className="text-sm">{organisation?.primaryContactEmail}</div>
          </div>
        )}
        {organisation?.primaryContactPhone && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Contact number</span>
            </label>
            <div className="text-sm">{organisation?.primaryContactPhone}</div>
          </div>
        )}
        <div className="divider"></div>
        <h5>Admins</h5>

        {organisationAdmins?.map((item) => (
          <div key={item.id} className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">
                {item.firstName} {item.surname}
              </span>
            </label>
            <label className="label">
              <div className="label-text">{item.email}</div>
            </label>
          </div>
        ))}
        {/* <OrgAdmins organisation={organisation} /> */}
        {/* <div className="form-control">
          <label className="label cursor-pointer font-bold">
            <span className="label-text text-gray-dark">
              I will be the organisation admin
            </span>
            <input type="checkbox" className="checkbox-primary checkbox" />
          </label>
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text text-gray-dark">
              Add additional admins
            </span>
          </label>
        </div> */}
      </div>
    </>
  );
};
