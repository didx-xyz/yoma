import React from "react";

// Reusable labelled sidebar section: an icon + bold heading followed by content.
// Used by the opportunity detail views (skills, topics, languages, countries,
// custom fields, …) so the section chrome and icon usage stay consistent.
const DetailSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, icon, className, children }) => {
  return (
    <div className={className ?? "py-4 first:pt-0 last:pb-0"}>
      <div className="flex flex-row items-center gap-1 text-sm font-bold">
        {icon}
        <span className={icon ? "ml-1" : undefined}>{title}</span>
      </div>
      {children}
    </div>
  );
};

export default DetailSection;
