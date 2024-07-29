import Link from "next/link";
import type { UserSkillInfo } from "~/api/models/user";

export const SkillsCard: React.FC<{ data: UserSkillInfo[] }> = ({ data }) => {
  return (
    <>
      {data?.map((item) => (
        <div key={item.id} className="badge bg-green px-2 py-1 text-white">
          {item.infoURL && <Link href={item.infoURL}>{item.name}</Link>}
          {!item.infoURL && <div>{item.name}</div>}
        </div>
      ))}
    </>
  );
};
