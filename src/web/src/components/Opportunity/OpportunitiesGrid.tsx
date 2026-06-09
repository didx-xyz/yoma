import { OpportunityPublicSmallComponentV2 } from "./OpportunityPublicSmallV2";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import Link from "next/link";

interface InputProps {
  [id: string]: any;
  title?: string;
  data: OpportunitySearchResultsInfo;
  viewAllUrl?: string;
}

export const OpportunitiesGrid: React.FC<InputProps> = ({
  id,
  title,
  data,
  viewAllUrl,
}) => {
  return (
    <div key={`OpportunitiesGrid_${id}`}>
      {(data?.items?.length ?? 0) > 0 && (
        <div className="gap-6x flex flex-col">
          <div className="flex flex-row">
            <div className="flex grow">
              <div className="overflow-hidden text-xl font-semibold text-ellipsis whitespace-nowrap text-black md:max-w-[800px]">
                {title}
              </div>
            </div>
            {viewAllUrl && (
              <Link
                href={viewAllUrl}
                className="text-gray-dark my-auto items-end text-sm"
              >
                View all
              </Link>
            )}
          </div>

          {/* Fixed-size cards that wrap to fit as many per row as the screen allows */}
          <div className="flex w-full flex-row flex-wrap justify-center gap-4">
            {data.items.map((item: any) => (
              <OpportunityPublicSmallComponentV2
                key={`${id}_${item.id}`}
                data={item}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
