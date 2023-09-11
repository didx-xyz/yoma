import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { IoMdImage } from "react-icons/io";
import { UserInfo, type Organization } from "~/api/models/organisation";

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
            <div className="text-sm">{organisation?.name}</div>
          </div>
        )}

        {organisation?.websiteURL && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Company website</span>
            </label>
            <Link
              className="hover:text-success-600 focus:text-success-600 active:text-success-700 text-success transition duration-150 ease-in-out"
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
          <div className="text-sm">{organisation?.streetAddress}</div>
          <div className="text-sm">{organisation?.province}</div>
          <div className="text-sm">{organisation?.city}</div>
          <div className="text-sm">{organisation?.postalCode}</div>
        </div>

        {organisation?.tagline && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Tagline</span>
            </label>
            <div className="text-sm">{organisation?.tagline}</div>
          </div>
        )}

        {organisation?.biography && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Biography</span>
            </label>
            <div className="text-sm">{organisation?.biography}</div>
          </div>
        )}
        <div className="divider"></div>
        <h4>Company registration</h4>
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text text-gray-dark">Documents</span>
          </label>

          {/* display list of file links */}
          {organisation?.documents?.map((item) => (
            <Link key={item.fileId} href={item.url} target="_blank">
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
        <h4>Admins</h4>

        {organisationAdmins?.map((item) => (
          <div key={item.id} className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">
                {item.firstName} {item.surname}
              </span>
            </label>
            <div className="text-sm">{item.email}</div>
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
