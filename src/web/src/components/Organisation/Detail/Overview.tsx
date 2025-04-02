import Image from "next/image";
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
          <fieldset className="fieldset">
            <label className="label">
              <span className="label-text text-gray-dark">Name:</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.name}</div>
            </label>
          </fieldset>
        )}
        {organisation?.websiteURL && (
          <fieldset className="fieldset">
            <label className="label">
              <span className="label-text text-gray-dark">Website:</span>
            </label>
            <Link
              className="hover:text-success-600 focus:text-success-600 active:text-success-700 text-success pl-1 transition duration-150 ease-in-out"
              href={organisation?.websiteURL}
            >
              {organisation?.websiteURL}
            </Link>
          </fieldset>
        )}
        {organisation?.tagline && (
          <fieldset className="fieldset">
            <label className="label">
              <span className="label-text text-gray-dark">Tagline:</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.tagline}</div>
            </label>
          </fieldset>
        )}
        {organisation?.biography && (
          <fieldset className="fieldset">
            <label className="label">
              <span className="label-text text-gray-dark">Biography:</span>
            </label>
            <label className="label">
              <div className="label-text">{organisation?.biography}</div>
            </label>
          </fieldset>
        )}

        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text text-gray-dark">Logo:</span>
          </label>
          <fieldset className="flex min-w-max items-center justify-center">
            {/* NO IMAGE */}
            {!organisation?.logoURL && (
              <IoMdImage className="h-20 w-20 text-gray-400" />
            )}

            {/* EXISTING IMAGE */}
            {organisation?.logoURL && (
              <Image
                className="h-auto rounded-lg"
                alt="Company logo"
                width={150}
                src={organisation.logoURL}
              />
            )}
          </fieldset>
        </fieldset>

        <div className="divider"></div>

        <h5 className="font-bold tracking-wider">Contact Details</h5>

        <fieldset className="fieldset">
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
        </fieldset>

        <fieldset className="fieldset">
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
        </fieldset>

        <div className="divider"></div>

        <h5 className="font-bold tracking-wider">Roles</h5>

        <fieldset className="fieldset">
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
        </fieldset>

        <div className="divider"></div>

        <h5 className="font-bold tracking-wider">Company Registration</h5>

        <fieldset className="fieldset">
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
        </fieldset>

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
