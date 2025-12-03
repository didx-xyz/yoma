import Head from "next/head";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { cleanTextForMetaTag } from "~/lib/utils";

const OpportunityMetaTags: React.FC<{
  opportunityInfo: OpportunityInfo;
}> = ({ opportunityInfo }) => {
  const title = opportunityInfo?.title ?? "Yoma | Opportunity";
  const description = opportunityInfo?.description ?? "";

  const safeTitle = cleanTextForMetaTag(title, 50);
  const safeDescription = cleanTextForMetaTag(description, 155);
  const ogTitle = cleanTextForMetaTag(title, 60);
  const ogDescription = cleanTextForMetaTag(description, 200);

  return (
    <Head>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta
        property="og:image"
        content={opportunityInfo?.organizationLogoURL ?? ""}
      />
      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta
        name="twitter:image"
        content={opportunityInfo?.organizationLogoURL ?? ""}
      />

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
