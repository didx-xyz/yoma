import { OpportunityPublicSmallComponent } from "./OpportunityPublicSmall";
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
            <div className="flex flex-grow">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-black md:max-w-[800px]">
                {title}
              </div>
            </div>
            {viewAllUrl && (
              <Link
                href={viewAllUrl}
                className="my-auto items-end text-sm text-gray-dark"
              >
                View all
              </Link>
            )}
          </div>

          <div className="grid w-full place-items-center">
            <div className="xs:grid-cols-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((item: any) => (
                <OpportunityPublicSmallComponent
                  key={`${id}_${item.id}`}
                  data={item}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
