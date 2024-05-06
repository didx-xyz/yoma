import Head from "next/head";
import type { OpportunityInfo } from "~/api/models/opportunity";

const OpportunityMetaTags: React.FC<{
  opportunityInfo: OpportunityInfo;
}> = ({ opportunityInfo }) => {
  const title = opportunityInfo?.title ?? "Yoma | Opportunity";
  const description = opportunityInfo?.description ?? "";

  const safeTitle = title.length > 50 ? title.substring(0, 47) + "..." : title;
  const safeDescription =
    description.length > 155
      ? description.substring(0, 152) + "..."
      : description;
  const ogTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
  const ogDescription =
    description.length > 200
      ? description.substring(0, 197) + "..."
      : description;

  return (
    <Head>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta
        property="og:image"
        content={opportunityInfo?.organizationLogoURL ?? ""}
      />
      <meta property="og:image:width" content="60" />
      <meta property="og:image:height" content="60" />
      <meta
        name="keywords"
        content={
          opportunityInfo?.keywords ? opportunityInfo.keywords.join(", ") : ""
        }
      />
    </Head>
  );
};

export default OpportunityMetaTags;
