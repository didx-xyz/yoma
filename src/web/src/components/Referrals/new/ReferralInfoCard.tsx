import { type ReactNode } from "react";

interface ReferralInfoCardProps {
  children: ReactNode;
}

export const ReferralInfoCard = ({ children }: ReferralInfoCardProps) => {
  return (
    <div className="flex flex-col gap-8 rounded-xl bg-white p-4 text-sm shadow md:p-5">
      {children}
    </div>
  );
};
