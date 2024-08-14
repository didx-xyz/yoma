import Link from "next/link";
import { IoMdImage } from "react-icons/io";
import { type Organization } from "~/api/models/organisation";

export interface InputProps {
  organisation: Organization | undefined;
}

export const Overview: React.FC<InputProps> = ({ organisation }) => {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h5 className="font-bold tracking-wider">Organisation Details</h5>
        {organisation?.name && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Name:</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.name}</div>
            </label>
          </div>
        )}
        {organisation?.websiteURL && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Website:</span>
            </label>
            <Link
              className="hover:text-success-600 focus:text-success-600 active:text-success-700 pl-1 text-success transition duration-150 ease-in-out"
              href={organisation?.websiteURL}
            >
              {organisation?.websiteURL}
            </Link>
          </div>
        )}
        {organisation?.tagline && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Tagline:</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.tagline}</div>
            </label>
          </div>
        )}
        {organisation?.biography && (
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-dark">Biography:</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.biography}</div>
            </label>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">Logo:</span>
          </label>
          <div className="flex min-w-max items-center justify-center">
            {/* NO IMAGE */}
            {!organisation?.logoURL && (
              <IoMdImage className="text-gray-400 h-20 w-20" />
            )}

            {/* EXISTING IMAGE */}
            {organisation?.logoURL && (
              <>
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
        </div>

        <div className="divider"></div>

        <h5 className="font-bold tracking-wider">Contact Details</h5>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">Primary Contact:</span>
          </label>
          <label className="label">
            <div className="label-text">
              {organisation?.primaryContactName}
              <br />
              {organisation?.primaryContactEmail}
              <br />
              {organisation?.primaryContactPhone}
            </div>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">Address:</span>
          </label>
          <label className="label">
            <div className="label-text">
              {organisation?.streetAddress}
              <br />
              {organisation?.province}
              <br />
              {organisation?.city}
              <br />
              {organisation?.postalCode}
              <br />
              {organisation?.country}
            </div>
          </label>
        </div>

        <div className="divider"></div>

        <h5 className="font-bold tracking-wider">Roles</h5>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">
              Interested in becoming:
            </span>
          </label>
          <ul className="ml-5 list-disc">
            {organisation?.providerTypes?.map((item) => (
              <li key={item.id}>
                <label htmlFor={item.id} className="label-text">
                  {item.name}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="divider"></div>

        <h5 className="font-bold tracking-wider">Company Registration</h5>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-dark">Documents:</span>
          </label>

          <ul className="ml-5 list-disc">
            {organisation?.documents?.map((item) => (
              <li key={item.fileId}>
                <Link href={item.url} target="_blank" className="label-text">
                  {item.originalFileName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="divider"></div>

        <h5 className="font-bold tracking-wider">Admins</h5>

        <ul>
          {organisation?.administrators?.map((item) => (
            <li key={item.id} className="label-text ml-5 list-disc">
              <span className="font-semibold">{item.displayName}</span> (
              {item.email})
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
