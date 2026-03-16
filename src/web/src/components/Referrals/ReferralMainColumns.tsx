import { type ReactNode } from "react";

interface ReferralMainColumnsProps {
  left: ReactNode;
  right: ReactNode;
}

export const ReferralMainColumns = ({
  left,
  right,
}: ReferralMainColumnsProps) => {
  return (
    <div className="mt-4 flex flex-col gap-4 md:flex-row">
      <div className="grow space-y-4 md:w-[66%]">{left}</div>
      <div className="flex flex-col gap-3 md:w-[34%]">{right}</div>
    </div>
  );
};
