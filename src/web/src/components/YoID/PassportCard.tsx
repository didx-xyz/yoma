export const PassportCard: React.FC<{
  data: { schemaType: string; totalCount: number | null }[];
}> = ({ data }) => {
  return (
    <div className="flex flex-grow flex-col justify-center gap-2 text-xs">
      {data?.map((item) => (
        <div key={item.schemaType} className="flex flex-row flex-nowrap gap-2">
          <span className="flex flex-grow items-center whitespace-nowrap">
            {item.schemaType === "YoID" && "💳"}
            {item.schemaType === "Opportunity" && "🏆"}
            <span className="ml-2">{item.schemaType}</span>
          </span>
          <span className="badge badge-xs bg-gray">
            {item.totalCount ?? "?"}
          </span>
        </div>
      ))}
    </div>
  );
};
