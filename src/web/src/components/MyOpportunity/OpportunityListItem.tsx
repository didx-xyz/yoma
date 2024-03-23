import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import Moment from "react-moment";
import { DATETIME_FORMAT_HUMAN } from "~/lib/constants";
import { useCallback } from "react";
import { AvatarImage } from "../AvatarImage";
import { useRouter } from "next/router";

const OpportunityListItem: React.FC<{
  data: MyOpportunityInfo;
  onClick?: (certificate: MyOpportunityInfo) => void;
  displayDate: string;
  [key: string]: any;
}> = ({ data, onClick, displayDate }) => {
  const router = useRouter();
  const { pathname } = router;

  // 🔔 click handler: use callback parameter
  const handleClick = useCallback(() => {
    if (!onClick) return;
    onClick(data);
  }, [data, onClick]);

  return (
    <div
      onClick={handleClick}
      className="flex cursor-pointer flex-col gap-1 rounded-lg border-[1px] border-gray bg-white p-4"
    >
      <div className="flex flex-row gap-2">
        <AvatarImage
          icon={data.organizationLogoURL ? data.organizationLogoURL : null}
          alt="Organization Logo"
          size={60}
        />

        <div className="flex flex-col justify-center gap-1 overflow-ellipsis ">
          <h1 className="line-clamp-1 text-xs font-medium text-gray-dark">
            {data.organizationName}
          </h1>
          <h2 className="line-clamp-3 text-[18px] font-semibold leading-tight md:line-clamp-1">
            {data.opportunityTitle}
          </h2>
        </div>
      </div>

      <div className="flex h-full max-h-[60px] flex-row">
        <p className="text-[rgba(84, 88, 89, 1)] line-clamp-4 text-sm font-light">
          {data.opportunityDescription}
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
                  className="badge whitespace-nowrap rounded-md bg-green-light text-[12px] font-semibold text-green"
                  key={`skill_${index}`}
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </>
        )}

        {/* DATE */}
        {displayDate && (
          <div className="flex flex-row">
            <h4 className="line-clamp-4 text-sm font-thin">
              <Moment format={DATETIME_FORMAT_HUMAN} utc={true}>
                {displayDate}
              </Moment>
            </h4>
          </div>
        )}

        {/* COMMENT */}
        {data.commentVerification && (
          <div className="flex flex-row gap-1">
            <h4 className="line-clamp-4 text-sm font-bold">Comment: </h4>
            <h4 className="line-clamp-4 text-sm font-thin">
              {data.commentVerification}
            </h4>
          </div>
        )}
      </div>
    </div>
  );
};

export { OpportunityListItem };
