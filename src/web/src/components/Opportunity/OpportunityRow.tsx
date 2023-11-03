import { OpportunityPublicSmallComponent } from "./OpportunityPublicSmall";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import Link from "next/link";

interface InputProps {
  [id: string]: any;
  title: string;
  data: OpportunitySearchResultsInfo;
  viewAllUrl?: string;
}

export const OpportunityRow: React.FC<InputProps> = ({
  id,
  title,
  data,
  viewAllUrl,
}) => {
  // 🧮 analytics
  // useEffect(() => {
  //   ga.view_item_list({
  //     item_list_id: id,
  //     item_list_name: title,
  //     items: opportunities.items.map((item) => ({
  //       item_id: item.id,
  //       item_name: item.name,
  //       item_category: "Opportunity",
  //       price: item.priceInUSD,
  //       quantity: 1,
  //     })),
  //   });
  // }, [id, title, opportunities]);

  // 🔔 click handler:
  // const handleClick = useCallback(
  //   (item: OpportunityInfo) => {
  //     // ga.select_item({
  //     //   item_list_id: id,
  //     //   item_list_name: title,
  //     //   items: [
  //     //     {
  //     //       item_id: item.id,
  //     //       item_name: item.name,
  //     //       item_category: "Opportunity",
  //     //       price: item.priceInUSD,
  //     //       quantity: 1,
  //     //     },
  //     //   ],
  //     // });
  //   },
  //   [id, title],
  // );

  return (
    <div key={`OpportunityCarousel_${id}`}>
      {(data?.items?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row">
            <div className="flex-grow">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl text-black md:max-w-[800px]">
                {title}
              </div>{" "}
            </div>
            {viewAllUrl && (
              <Link
                href={viewAllUrl}
                className="items-end text-sm text-gray-dark"
              >
                View all
              </Link>
            )}
          </div>

          <div className="grid w-full place-items-center">
            <div className="grid gap-5">
              <div className="xs:grid-cols-1 sm :grid-cols-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.items.map((item: any) => (
                  <OpportunityPublicSmallComponent
                    key={`${id}_${item.id}`}
                    data={item}
                    //onClick={handleClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
