import Link from "next/link";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { AvatarImage } from "../AvatarImage";
import ZltoRewardBadge from "./Badges/ZltoRewardBadge";
import {
  getTypeConfig,
  OpportunityMetaTextRow,
  OpportunityOrgCountriesRow,
  OpportunityTitleRow,
  OpportunityTypeBadge,
} from "./opportunityTypeTheme";

// Skill badges row. Shows up to `maxSkills` badges (the 3rd only from `sm` up)
// followed by a "+N" overflow badge. Renders nothing when there are no skills.
const OpportunitySkillsRow: React.FC<{
  data: OpportunityInfo;
  maxSkills?: number;
}> = ({ data, maxSkills = 3 }) => {
  const skills = data.skills ?? [];
  const visibleSkills = skills.slice(0, maxSkills);
  const remainingSkills = skills.length - visibleSkills.length;

  if (visibleSkills.length === 0) return null;

  return (
    <div className="flex flex-row flex-nowrap gap-2 pt-2">
      {visibleSkills.map((skill, i) => (
        <span
          key={skill.id}
          className={`bg-gray-light text-gray-dark h-6 max-w-18 items-center rounded-md px-2 text-xs font-medium ${
            i >= 2 ? "hidden sm:flex" : "flex"
          }`}
          title={skill.name}
        >
          <span className="truncate">{skill.name}</span>
        </span>
      ))}
      {remainingSkills > 0 && (
        <span
          className="bg-gray-light text-gray-dark flex h-6 max-w-12 items-center rounded-md px-2 text-xs font-medium"
          title={`${remainingSkills} more skill${remainingSkills > 1 ? "s" : ""}`}
        >
          <span className="truncate">+{remainingSkills}</span>
        </span>
      )}
    </div>
  );
};

// Description (summary preferred), clamped to 2 lines. Always reserves 2 line
// heights so cards stay aligned. Renders nothing when there's no text.
const OpportunityDescriptionRow: React.FC<{
  data: OpportunityInfo;
  lines?: number;
}> = ({ data, lines = 2 }) => {
  const text = data.summary ?? data.description;
  if (!text) return null;

  return (
    <p
      className={`text-gray-dark line-clamp-${lines} min-hxxxx-[${lines}lh] text-sm`}
      title={text}
    >
      {text}
    </p>
  );
};

// Call-to-action button. In preview mode it renders an inert element (not a
// link) so it can't be clicked and is not a nested interactive <a>.
const CardCta: React.FC<{
  href: string;
  text: string;
  title: string;
  className: string;
  preview?: boolean;
}> = ({ href, text, title, className, preview }) => {
  const base = `flex h-10 w-full shrink-0 flex-row items-center justify-center gap-2 rounded-lg text-sm font-semibold duration-300 ${className}`;

  if (preview) {
    return (
      <div
        className={`${base} pointer-events-none`}
        title={title}
        aria-disabled="true"
      >
        <span>{text}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={base}
      title={title}
    >
      <span>{text}</span>
    </Link>
  );
};

const JobCardSmall: React.FC<{ data: OpportunityInfo; preview?: boolean }> = ({
  data,
  preview,
}) => {
  return (
    <div className="flex h-70 w-80 flex-col rounded-2xl bg-white p-4 max-[370px]:w-64 max-[370px]:p-3">
      <div className="items-between flex h-full flex-col gap-1">
        {/* TOP: badge + title + org (left column) and logo (right column) */}
        <div className="flex flex-row items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* ENGAGEMENT TYPE BADGE */}
            <div className="flex flex-row items-center gap-2">
              <OpportunityTypeBadge
                data={data}
                //label="Job"
                className="bg-purple text-white"
              />

              {data?.zltoRewardEstimate != null && (
                <ZltoRewardBadge amount={data.zltoRewardEstimate} />
              )}
            </div>

            {/* TITLE */}
            <div className="font-family-nunito flex items-center text-base leading-tight font-bold text-black">
              <span className="line-clamp-3 text-ellipsis" title={data.title}>
                {data.title}
              </span>
            </div>
          </div>

          <AvatarImage
            icon={data?.organizationLogoURL ?? null}
            alt="Company Logo"
            size={50}
          />
        </div>

        <OpportunityOrgCountriesRow data={data} />

        <OpportunityDescriptionRow data={data} />

        <div className="mt-auto space-y-2">
          <OpportunityMetaTextRow data={data} />

          {/* APPLY BUTTON */}
          <CardCta
            href={`/opportunities/${data.id}`}
            text="Apply now →"
            title="Apply for this job opportunity"
            className="bg-purple hover:bg-purple-shade text-white"
            preview={preview}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// NON-JOB CARDS — per-type rendering modes (logo bubble + badge + title +
// meta + CTA). Each type has its own colour theme (see opportunityTypeTheme).
// ---------------------------------------------------------------------------
const DefaultCard: React.FC<{ data: OpportunityInfo; preview?: boolean }> = ({
  data,
  preview,
}) => {
  const config = getTypeConfig(data.type);

  return (
    <div className="flex h-94 w-80 flex-col rounded-2xl bg-white p-3 max-[370px]:w-64">
      {/* ORG LOGO BUBBLE */}
      <div
        className={`relative flex h-24 shrink-0 items-center justify-center rounded-xl ${config.bubbleClassName}`}
      >
        <AvatarImage
          icon={data?.organizationLogoURL ?? null}
          alt={data.organizationName ?? "Organisation logo"}
          size={64}
        />
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col gap-2 pt-3">
        {/* TYPE BADGE */}
        <div className="flex flex-row items-center justify-between">
          <OpportunityTypeBadge data={data} className={config.badgeClassName} />

          {data?.zltoRewardEstimate != null && (
            <ZltoRewardBadge amount={data.zltoRewardEstimate} />
          )}
        </div>

        <OpportunityTitleRow data={data} lines={2} />

        <OpportunityOrgCountriesRow data={data} />

        <OpportunityDescriptionRow data={data} lines={1} />

        <div className="mt-auto space-y-2">
          <OpportunitySkillsRow data={data} />

          <OpportunityMetaTextRow data={data} />

          {/* CTA BUTTON */}
          <CardCta
            href={`/opportunities/${data.id}`}
            text={config.ctaText}
            title={config.ctaTitle}
            className={config.ctaClassName}
            preview={preview}
          />
        </div>
      </div>
    </div>
  );
};

const JobCard: React.FC<{ data: OpportunityInfo; preview?: boolean }> = ({
  data,
  preview,
}) => {
  const config = getTypeConfig(data.type);

  return (
    <div className="flex h-94 w-80 flex-col rounded-2xl bg-white p-3 max-[370px]:w-64">
      {/* ORG LOGO BUBBLE */}
      <div
        className={`relative flex h-24 shrink-0 items-center justify-center rounded-xl ${config.bubbleClassName}`}
      >
        <AvatarImage
          icon={data?.organizationLogoURL ?? null}
          alt={data.organizationName ?? "Organisation logo"}
          size={64}
        />
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col gap-2 pt-3">
        {/* TYPE BADGE */}
        <div className="flex flex-row items-center justify-between">
          <OpportunityTypeBadge data={data} className={config.badgeClassName} />

          {data?.zltoRewardEstimate != null && (
            <ZltoRewardBadge amount={data.zltoRewardEstimate} />
          )}
        </div>

        <OpportunityTitleRow data={data} lines={3} />

        <OpportunityOrgCountriesRow data={data} />

        <OpportunityDescriptionRow data={data} />

        <div className="mt-auto space-y-2">
          <OpportunityMetaTextRow data={data} />

          {/* CTA BUTTON */}
          <CardCta
            href={`/opportunities/${data.id}`}
            text={config.ctaText}
            title={config.ctaTitle}
            className={config.ctaClassName}
            preview={preview}
          />
        </div>
      </div>
    </div>
  );
};

export { DefaultCard, JobCard, JobCardSmall };
