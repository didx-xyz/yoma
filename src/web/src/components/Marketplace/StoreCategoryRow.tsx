import type { StoreCategory } from "~/api/models/marketplace";
import { StoreCategoryComponent } from "./StoreCategory";

interface InputProps {
  [id: string]: any;
  data: StoreCategory[];
}

export const StoreCategoryRow: React.FC<InputProps> = ({ id, data }) => {
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
    <div key={`StoreCategories_${id}`}>
      {(data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-6">
          {/* <div className="flex flex-row">
            <div className="flex-grow">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-black md:max-w-[800px]">
                {title}
              </div>
            </div>
          </div> */}

          <div className="grid w-full place-items-center">
            <div className="xs:grid-cols-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.map((item: any) => (
                <StoreCategoryComponent
                  key={`${id}_${item.id}`}
                  data={item}
                  //onClick={handleClick}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
