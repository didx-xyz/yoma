import Link from "next/link";
import Moment from "react-moment";
import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { AvatarImage } from "../AvatarImage";
import { useRouter } from "next/router";
import { DisplayType } from "./OpportunitiesCarousel";

interface InputProps {
  data: MyOpportunityInfo;
  displayType: DisplayType;
  [key: string]: any;
}

const OpportunityCard: React.FC<InputProps> = ({ data, displayType }) => {
  const router = useRouter();
  const { pathname } = router;

  return (
    <Link
      href={`/opportunities/${data.id}`}
      className="relative flex h-[19.2rem] flex-col gap-1 overflow-hidden rounded-lg bg-white p-4 shadow-md md:w-[19.2rem]"
    >
      <div className="mb-2 flex flex-row gap-2">
        <AvatarImage
          icon={data.organizationLogoURL ? data.organizationLogoURL : null}
          alt="Organization Logo"
          size={60}
        />

        <div className="truncatex flex flex-col justify-center gap-1">
          <h1 className="line-clamp-1 text-xs font-medium text-gray-dark">
            {data.organizationName}
          </h1>
          <h2 className="line-clamp-2 text-sm font-semibold leading-tight md:line-clamp-1">
            {data.opportunityTitle}
          </h2>
        </div>
      </div>

      <div className="flex h-full max-h-[60px] flex-row">
        <p className="line-clamp-4 text-xs font-light text-gray-dark">
          {data.opportunitySummary}
        </p>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {/* SKILLS */}
        {pathname.includes("completed") && (
          <>
            <div className="flex flex-row">
              <h4 className="line-clamp-4 text-sm font-bold">
                Skills developed
              </h4>
            </div>
            <div className="flex flex-row flex-wrap gap-2">
              {data.skills?.map((skill, index) => (
                <div
                  className="badge truncate whitespace-nowrap rounded-md bg-green-light text-[12px] font-semibold text-green"
                  key={`skill_${index}`}
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </>
        )}

        {/* DATE */}
        <div className="flex flex-row">
          <h4 className="line-clamp-4 text-sm font-medium">
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {displayType == DisplayType.Completed ||
              displayType == DisplayType.Pending
                ? data.dateCompleted?.toString()
                : data.dateModified?.toString()}
            </Moment>
          </h4>
        </div>

        {/* COMMENT */}
        {displayType == DisplayType.Rejected && data.commentVerification && (
          <div className="flex flex-row flex-wrap gap-1">
            <h4 className="line-clamp-4 text-xs font-bold">Comment: </h4>
            <h4 className="line-clamp-4 text-xs font-thin">
              {data.commentVerification}
            </h4>
          </div>
        )}
      </div>
    </Link>
  );
};

export { OpportunityCard };
