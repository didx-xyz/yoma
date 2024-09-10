import Link from "next/link";
import type { UserSkillInfo } from "~/api/models/user";
import NoRowsMessage from "../NoRowsMessage";

export const SkillsCard: React.FC<{ data: UserSkillInfo[] }> = ({ data }) => {
  if (!data?.length) {
    return (
      <NoRowsMessage
        title={""}
        description={
          "All your skills from completed opportunities will automatically appear here."
        }
        icon={"⚡"}
        classNameIcon={"h-[60px] w-[60px]"}
      />
    );
  }

  return (
    <>
      {data?.map((item) => (
        <div key={item.id} className="badge bg-green px-2 py-1 text-white">
          {item.infoURL && <Link href={item.infoURL}>{item.name}</Link>}
          {!item.infoURL && (
            <div className="max-w-[200px] truncate">{item.name}</div>
          )}
        </div>
      ))}
    </>
  );
};
