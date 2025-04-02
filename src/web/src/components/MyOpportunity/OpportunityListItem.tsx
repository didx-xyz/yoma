import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { AvatarImage } from "../AvatarImage";
import { useRouter } from "next/router";
import Link from "next/link";
import FileSaver from "file-saver";
import { downloadVerificationFiles } from "~/api/services/myOpportunities";
import { FaDownload } from "react-icons/fa";

const OpportunityListItem: React.FC<{
  data: MyOpportunityInfo;
  displayDate: string;
  [key: string]: any;
}> = ({ data, displayDate }) => {
  const router = useRouter();
  const { pathname } = router;

  const downloadFiles = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = await downloadVerificationFiles({
      opportunity: data.opportunityId,
      verificationTypes: null,
    });
    if (!file) return;

    FileSaver.saveAs(file);
  };

  return (
    <Link
      href={`/opportunities/${data.opportunityId}`}
      className="border-gray shadow-custom flex cursor-pointer flex-col gap-1 rounded-lg border-none bg-white p-4"
    >
      <div className="mb-2 flex flex-row gap-2">
        <AvatarImage
          icon={data.organizationLogoURL ? data.organizationLogoURL : null}
          alt="Organization Logo"
          size={60}
        />

        <div className="flex flex-col justify-center gap-1 text-ellipsis">
          <h1 className="text-gray-dark line-clamp-1 text-xs font-medium">
            {data.organizationName}
          </h1>
          <h2 className="line-clamp-2 text-[18px] leading-tight font-semibold md:line-clamp-1">
            {data.opportunityTitle}
          </h2>
        </div>
      </div>

      <div className="flex h-full max-h-[60px] flex-row">
        <p className="text-[rgba(84, 88, 89, 1)] line-clamp-4 text-sm font-light">
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
                  className="badge bg-green-light text-green truncate rounded-md text-[12px] font-semibold whitespace-nowrap"
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
              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                {displayDate}
              </Moment>
            </h4>
          </div>
        )}

        {/* DOWNLOAD LINK */}
        {!!data?.verifications?.filter((x) => x.fileURL).length && (
          <div className="flex flex-row">
            <h4 className="line-clamp-4 text-sm font-thin">
              <button
                className="btn btn-secondary btn-sm"
                onClick={downloadFiles}
              >
                <FaDownload className="size-4" />
                Download your completion files ({
                  data?.verifications?.length
                }{" "}
                total)
              </button>
            </h4>
          </div>
        )}

        {/* COMMENT */}
        {data.commentVerification && (
          <div className="flex flex-row flex-wrap gap-1">
            <h4 className="line-clamp-4 text-sm font-bold">Comment: </h4>
            <h4 className="line-clamp-4 text-sm font-thin">
              {data.commentVerification}
            </h4>
          </div>
        )}
      </div>
    </Link>
  );
};

export { OpportunityListItem };
