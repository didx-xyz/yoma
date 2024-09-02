import Image from "next/image";
import stamp1 from "public/images/stamp-1.png";
import NoRowsMessage from "../NoRowsMessage";

export const PassportCard: React.FC<{
  data: { schemaType: string; totalCount: number | null }[];
}> = ({ data }) => {
  // Check if data is null, empty, or if all counts are 0 or null
  const allCountsZero =
    !data ||
    data.length === 0 ||
    data.every((item) => item.totalCount === null || item.totalCount === 0);

  if (allCountsZero) {
    return (
      <NoRowsMessage
        title={""}
        description={
          "All verified work is stored to your passport using Blockchain digital certificates.🤝"
        }
        icon={"🌐"}
        classNameIcon={"h-[60px] w-[60px]"}
      />
    );
  }

  return (
    <div className="flex flex-grow flex-col justify-center text-xs md:text-sm">
      <Image src={stamp1} alt="Stamps" className="absolute opacity-50" />
      <div className="text-gray-dark">
        Your digital passport contains the credentials you receive from
        completing opportunities.
      </div>
      <div className="flex flex-grow items-center justify-end">
        <div className="flex flex-col gap-1">
          {data?.map((item) => (
            <div
              key={item.schemaType}
              className="flex flex-row flex-nowrap gap-2"
            >
              <span className="flex flex-grow items-center whitespace-nowrap">
                {item.schemaType === "YoID" && (
                  <span>
                    💳<span className="ml-2">Identity</span>
                  </span>
                )}
                {item.schemaType === "Opportunity" && (
                  <span>
                    🏆
                    <span className="ml-2">Opportunities</span>
                  </span>
                )}
                {item.schemaType !== "YoID" &&
                  item.schemaType !== "Opportunity" && (
                    <span>
                      ❔<span className="ml-2">{item.schemaType}</span>
                    </span>
                  )}
              </span>
              <span className="badge badge-xs ml-4 min-w-[40px] bg-gray px-2">
                {item.totalCount ?? "0"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
