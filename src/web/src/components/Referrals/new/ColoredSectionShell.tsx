import { type ReactNode } from "react";

interface ColoredSectionShellProps {
  backgroundClassName: string;
  sectionClassName?: string;
  containerClassName?: string;
  children: ReactNode;
}

export const ColoredSectionShell = ({
  backgroundClassName,
  sectionClassName = "relative z-10 w-full py-10",
  containerClassName = "mx-auto w-full md:max-w-6xl px-4  ",
  children,
}: ColoredSectionShellProps) => {
  return (
    <div className={`${backgroundClassName} w-full`}>
      <section className={sectionClassName}>
        <div className={containerClassName}>{children}</div>
      </section>
    </div>
  );
};
