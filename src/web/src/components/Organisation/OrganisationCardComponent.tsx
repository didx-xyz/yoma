import Link from "next/link";
import { OrganizationInfo } from "~/api/models/organisation";
import { ROLE_ADMIN } from "~/lib/constants";
import { AvatarImage } from "../AvatarImage";
import { User } from "~/server/auth";

export const OrganisationCardComponent: React.FC<{
  key: string;
  item: OrganizationInfo;
  user: User;
}> = (props) => {
  const link = props.user.roles.includes(ROLE_ADMIN)
    ? props.item.status === "Active"
      ? `/organisations/${props.item.id}/info`
      : `/organisations/${props.item.id}/verify`
    : props.item.status === "Active"
      ? `/organisations/${props.item.id}`
      : `/organisations/${props.item.id}/edit`;

  return (
    <Link href={link} id={`lnkOrganisation_${props.item.name}`}>
      <div
        key={`$orgCard_{props.key}`}
        className="flex flex-row rounded-xl bg-white shadow-custom transition duration-300 hover:scale-[1.01] dark:bg-neutral-700 md:max-w-7xl"
      >
        <div className="flex w-1/4 items-center justify-center p-2">
          <div className="flex h-28 w-28 items-center justify-center">
            <AvatarImage
              icon={props.item.logoURL ?? null}
              alt={props.item.name ?? null}
              size={60}
            />
          </div>
        </div>

        <div className="relative flex w-3/4 flex-col justify-start p-2 pr-4">
          <h5
            className={`my-1 truncate overflow-ellipsis whitespace-nowrap font-medium ${
              props.item.status === "Inactive" ? "pr-20" : ""
            }`}
          >
            {props.item.name}
          </h5>
          <p className="h-[40px] overflow-hidden text-ellipsis text-sm">
            {props.item.tagline}
          </p>
          {props.item.status && props.item.status === "Inactive" && (
            <span className="badge absolute bottom-4 right-4 border-none bg-yellow-light text-xs font-bold text-yellow md:top-4">
              Pending
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
