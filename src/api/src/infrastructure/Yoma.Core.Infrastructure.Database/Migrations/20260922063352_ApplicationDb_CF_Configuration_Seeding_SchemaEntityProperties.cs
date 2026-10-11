using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.SSI;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_SchemaEntityProperties
  {
    #region Class Variables
    private static readonly string[] PropertyColumns =
    [
      "Id", "SSISchemaEntityId", "Name", "NameDisplay", "Description", "Required",
      "SystemType", "Format", "Group", "SubGroup", "SortOrder", "DateCreated"
    ];
    private static readonly string[] PresentationColumns = ["Group", "SubGroup", "SortOrder"];
    #endregion Class Variables

    #region Public Members
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region SSI
      #region Schema Entity Properties
      // YoID's protected DisplayName is the wallet title, not another body row.
      // Put names first, followed by the remaining identity fields. Contact properties stay
      // available to historical/custom schemas, but the default does not select them.
      UpdatePresentation(migrationBuilder, "D26B85E6-223E-48B6-A12F-6C2D0136DD2F", "Identity", 1); // First name
      UpdatePresentation(migrationBuilder, "F7D89C98-0447-42DF-8A2D-A369B9FBAEBA", "Identity", 2); // Surname
      UpdatePresentation(migrationBuilder, "D56808D2-F3DB-4D82-AA5C-1FBA04C8E3BD", "Identity", 3); // Date of birth
      UpdatePresentation(migrationBuilder, "B14C9C34-4C89-4DAE-88AB-9D667BE2EF7F", "Identity", 4); // Country
      UpdatePresentation(migrationBuilder, "C26D9276-5F94-4BB3-94BA-67C435025708", "Identity", 5); // Gender
      UpdatePresentation(migrationBuilder, "B88A8825-FC5A-4000-93FE-9406A7898C58", "Identity", 6); // Education
      UpdatePresentation(migrationBuilder, "32447353-1698-467C-8B5D-AD85E89235B0", "Identity", 8); // Email
      UpdatePresentation(migrationBuilder, "64D4CBEB-3692-4E39-AAA7-B704F46AFB6D", "Identity", 9); // Phone

      // All defaults share one completion section. Positions 3-14 hold the type-specific
      // fields (the largest current set is Entrepreneurship); omitted fields leave no UI rows.
      // Keep location/duration next and verification last. Catalogue-only legacy/detail
      // selections follow the default fields without colliding with their positions.
      UpdatePresentation(migrationBuilder, "A3E3FF94-67E0-4A03-983F-8D3D5DF5B56A", "Completion Details", 1); // User
      UpdatePresentation(migrationBuilder, "F4BAA24B-463F-4B74-BA81-7CC5DCBE8DF5", "Completion Details", 2); // Skills earned
      UpdatePresentation(migrationBuilder, "8AD09B9C-61A1-4A68-B401-E926DD84E9DC", "Completion Details", 19); // Completion date
      UpdatePresentation(migrationBuilder, "682974E4-7AAB-4060-8A27-426F91C02ADD", "Completion Details", 20); // Reward
      UpdatePresentation(migrationBuilder, "CB8DE9BF-4C7C-429E-9B99-D92C9C6D79A0", "Completion Details", 21); // Historical DOB

      // Display labels are database metadata, not signed claims. Seed their exact casing here;
      // runtime discovery/wallet rendering must preserve configured labels and CF titles.
      // Non-Job defaults attest Skills Earned; Job defaults select neither skills source.
      migrationBuilder.UpdateData(
        schema: "SSI",
        table: "SchemaEntityProperty",
        keyColumn: "Id",
        keyValues:
        [
          "D56808D2-F3DB-4D82-AA5C-1FBA04C8E3BD",
          "084B3027-AF8A-4329-8221-C6437CFBCD61",
          "79E64F8F-5B1E-4DE2-88D4-2148E30CC49C",
          "F4BAA24B-463F-4B74-BA81-7CC5DCBE8DF5",
          "CB8DE9BF-4C7C-429E-9B99-D92C9C6D79A0",
          "682974E4-7AAB-4060-8A27-426F91C02ADD",
          "A3E3FF94-67E0-4A03-983F-8D3D5DF5B56A"
        ],
        column: "NameDisplay",
        values:
        [
          "Date Of Birth",
          "Logo URL",
          "Organization Logo URL",
          "Skills Earned",
          "User Date Of Birth",
          "ZLTO Reward",
          "User"
        ]);

      // Protect the existing signed type claim using the established system-property mechanism.
      // Create/update automatically includes it; historical schemas without it remain unchanged.
      migrationBuilder.UpdateData(
        schema: "SSI",
        table: "SchemaEntityProperty",
        keyColumn: "Id",
        keyValue: "755B1F54-1365-4D2F-AF29-8AEC57CC7B4C",
        column: "SystemType",
        value: SchemaEntityPropertySystemType.OpportunityType.ToString());

      // Difficulty capture moved to CF. Retain the old reflection mapping for historical/custom
      // schemas, but a missing CF value must not block their remaining queued issuance.
      migrationBuilder.UpdateData(
        schema: "SSI",
        table: "SchemaEntityProperty",
        keyColumn: "Id",
        keyValue: "FF423D0C-2E91-48A6-9245-28EEF6E96B01",
        column: "Required",
        value: false);

      // Extend the existing reflection catalogue; retain DOB, Completion Date and Difficulty
      // mappings for historical schemas and queued/custom credentials. New defaults omit them.
      migrationBuilder.InsertData(
        schema: "SSI",
        table: "SchemaEntityProperty",
        columns: PropertyColumns,
        values: new object?[,]
        {
          {
            "0e54c681-c7c9-476e-a5c9-0c7433220bd6", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "Countries.LocationDisplayName", "Opportunity Location",
            "Country, region and city where the opportunity is offered; not evidence of the youth's physical location.",
            false, null, null, "Opportunity Details", null, 5, DateTimeOffset.UtcNow
          },
          {
            "7df0110b-6fef-46c0-87de-c0a573b0999b", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "EngagementType", "Engagement",
            "Declared remote, on-site or hybrid engagement; separate from opportunity location.",
            false, null, null, "Opportunity Details", null, 6, DateTimeOffset.UtcNow
          },
          {
            "cabd88de-1b10-4b79-bae9-dfe3e8862dde", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "CommitmentIntervalDescription", "Duration",
            "Recorded participation commitment and unit; not an independently verified measure of time spent.",
            false, null, null, "Completion Details", null, 16, DateTimeOffset.UtcNow
          },
          {
            "db902ae7-7f9a-439b-90bf-e883af5b43f9", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "Verifications.VerificationTypeDisplayName", "Evidence Types Submitted",
            "Types of evidence actually submitted; excludes file links, geometry and configured but unused evidence types.",
            false, null, null, "Completion Details", null, 22, DateTimeOffset.UtcNow
          },
          {
            "ebf31029-cf82-447c-8ceb-7b94517b30ad", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "VerificationEvidence", "Verification Evidence",
            "Submitted evidence types, or the recorded action-link, CSV or partner verification comment; excludes private artifacts.",
            false, null, null, "Completion Details", null, 18, DateTimeOffset.UtcNow
          },
          {
            "67abfb94-cc26-48bd-9d80-9820fc2b4e76", "AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC",
            "AccountVerificationMethods", "Account Verification Methods",
            "Confirmed email, mobile OTP and recorded social sign-in at issuance; not KYC or verification of profile details.",
            false, null, null, "Identity", null, 7, DateTimeOffset.UtcNow
          },
          {
            "702f1728-cf60-4544-ad57-0c10f1f2d472", "AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC",
            "Region", "Region", "Self-declared profile region; not a verified address.",
            false, null, null, "Identity", null, 10, DateTimeOffset.UtcNow
          },
          {
            "128049d6-6d5b-4d8a-b6f2-5fc3d023bf04", "AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC",
            "City", "City", "Self-declared profile city; not a verified address.",
            false, null, null, "Identity", null, 11, DateTimeOffset.UtcNow
          },
          {
            "8c32151b-0da9-4a35-9426-1a4bb713fd41", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "VerificationMethod", "Verification Method",
            "Opportunity's configured manual or automatic method; not an independent record of the route used for this completion.",
            false, null, null, "Completion Details", null, 17, DateTimeOffset.UtcNow
          },
          {
            "b0e493a0-e202-45ac-9753-2e3f359c02dd", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "Description", "Opportunity Description", "Programme description; not the youth's personal completion outcome.",
            false, null, null, "Opportunity Details", null, 4, DateTimeOffset.UtcNow
          },
          {
            "3b7f7fe4-bbf8-4f32-ab25-072b32b4bb33", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "Provider", "Provider", "Informational provider; the owning organisation remains the credential issuer.",
            false, null, null, "Provider", null, 1, DateTimeOffset.UtcNow
          },
          {
            "3cfca090-30d0-4d9e-af30-a961fe346e24", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "ProviderURL", "Provider URL", "Optional provider website URL; not a logo, evidence or credential issuer reference.",
            false, null, null, "Provider", null, 2, DateTimeOffset.UtcNow
          },
          {
            "49203c8a-b161-46f2-a662-8cbd25d5e5ee", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "ProviderLogoURL", "Provider Logo URL", "Optional provider logo image URL, separate from its website and the owning organisation's logo.",
            false, null, null, "Provider", null, 3, DateTimeOffset.UtcNow
          },
          {
            "92f51238-ce42-42fd-9073-de3d3f7cafbc", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "ProviderCountry", "Provider Country", "Specific provider origin for discoverability; not opportunity availability or participation location.",
            false, null, null, "Provider", null, 4, DateTimeOffset.UtcNow
          },
          {
            "b60cd672-2c12-4915-8d92-6ee1345c03c8", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "Categories.Name", "Opportunity Categories", "Selected programme categories, not Job occupation or industry.",
            false, null, null, "Opportunity Details", null, 7, DateTimeOffset.UtcNow
          },
          {
            "73c911ce-2473-488a-a1d5-d99b01252e74", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "Languages.Name", "Opportunity Languages", "Languages declared for this opportunity; not the youth's proficiency.",
            false, null, null, "Opportunity Details", null, 8, DateTimeOffset.UtcNow
          },
          {
            "f803c469-cec1-4ac9-b4ec-b45a412de5dd", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "DateStart", "Opportunity Start Date", "Programme start date; not the youth's participation or employment start.",
            false, null, "yyyy-MM-dd", "Opportunity Details", null, 9, DateTimeOffset.UtcNow
          },
          {
            "da6413d2-1552-4fdc-b7d0-9b0c97ef4ba2", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "DateEnd", "Opportunity End Date", "Programme end or Job application deadline; not the end of employment.",
            false, null, "yyyy-MM-dd", "Opportunity Details", null, 10, DateTimeOffset.UtcNow
          },
          {
            "61f99152-4fce-4d64-8864-2db7e828f437", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "CommitmentIntervalDescription", "Advertised Commitment", "Advertised effort and unit, separate from recorded participation commitment.",
            false, null, null, "Opportunity Details", null, 11, DateTimeOffset.UtcNow
          },
          {
            "a0134715-0f4e-4f81-8509-d60df178a68c", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "Incentivized", "Incentivized", "Whether an incentive was declared; absent does not mean no incentive.",
            false, null, null, "Incentives", null, 1, DateTimeOffset.UtcNow
          },
          {
            "399c7ac6-e69e-4b15-97e5-562a21e58bf0", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "RewardType", "Reward Type", "Declared reward type; does not attest that payment was made.",
            false, null, null, "Incentives", null, 2, DateTimeOffset.UtcNow
          },
          {
            "bd1109d2-5b27-4761-9cb7-f8f6f67717d6", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "PartnerIncentiveAmount", "Partner Incentive Amount", "Informational partner-funded amount; not proof of payment or a Yoma award.",
            false, null, null, "Incentives", null, 3, DateTimeOffset.UtcNow
          },
          {
            "bb5d1f99-5698-45d0-8021-d69c8bbe5193", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "PartnerIncentiveCurrency", "Partner Incentive Currency", "ISO currency code of the declared partner incentive; not ZLTO.",
            false, null, null, "Incentives", null, 4, DateTimeOffset.UtcNow
          },
          {
            "cab4d8c1-ab26-4a2e-a481-c1b6b9b63550", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "ZltoReward", "Advertised ZLTO Reward", "Advertised ZLTO amount, separate from the recorded completion award.",
            false, null, null, "Incentives", null, 5, DateTimeOffset.UtcNow
          },
          {
            "d0a5b77c-7105-4bd7-ae76-0f764a2923de", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "AccessibilitySupport", "Accessibility Support", "Declared support; unspecified does not confirm an accommodation.",
            false, null, null, "Accessibility", null, 1, DateTimeOffset.UtcNow
          },
          {
            "50c4d875-4a19-4d4c-9fb2-2b959e6ead7f", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "Accommodations.Name", "Available Accommodations", "Declared accommodations, not a disclosure of the youth's accessibility needs.",
            false, null, null, "Accessibility", null, 2, DateTimeOffset.UtcNow
          },
          {
            "e10c2be4-cd24-4291-92a9-42fd8cfc888c", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "AccommodationOtherDescription", "Other Accommodation", "Description of the provider's Other accommodation.",
            false, null, null, "Accessibility", null, 3, DateTimeOffset.UtcNow
          },
          {
            "61b6a05e-8402-4f56-b6ba-0d0488467bc8", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "AgeFrom", "Minimum Age", "Inclusive declared age guidance, checked against self-declared birth date.",
            false, null, null, "Audience", null, 1, DateTimeOffset.UtcNow
          },
          {
            "688f50d2-0c1d-4e22-aad4-45d01c54b35e", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "AgeTo", "Maximum Age", "Inclusive declared age guidance, checked against self-declared birth date.",
            false, null, null, "Audience", null, 2, DateTimeOffset.UtcNow
          },
          {
            "ac382b50-7b1b-48d0-8c12-7e7c852bf074", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "TargetedGroups.Name", "Targeted Groups", "Informational programme audience; not a claim about the youth's identity.",
            false, null, null, "Audience", null, 3, DateTimeOffset.UtcNow
          },
          {
            "f3608301-3340-4d99-83a4-3ba3ce766a84", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "SustainableDevelopmentGoals.Name", "Sustainable Development Goals", "Declared programme SDGs; not a measured individual impact outcome.",
            false, null, null, "Impact", null, 1, DateTimeOffset.UtcNow
          },
          {
            "52ccf9a4-9866-4fa2-9a59-85a2b030914a", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "Location", "Location",
            "Stored participation or explicit business country, region and city; not opportunity availability or verified attendance.",
            false, null, null, "Completion Details", null, 15, DateTimeOffset.UtcNow
          },
          {
            "a2345df0-4c07-42e7-9fda-76fd867ea38e", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "Country", "Country", "Participation or explicit business country captured at submission; no historical backfill.",
            false, null, null, "Completion Details", null, 23, DateTimeOffset.UtcNow
          },
          {
            "cc65bb9d-724c-488d-94df-2b5604cc9c5e", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "Region", "Region", "Participation or business region captured at submission, when supplied with a country.",
            false, null, null, "Completion Details", null, 24, DateTimeOffset.UtcNow
          },
          {
            "d627361d-39b0-4db9-9b96-cf39d8dafcd6", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "City", "City", "Participation or business city captured at submission, when supplied with a country.",
            false, null, null, "Completion Details", null, 25, DateTimeOffset.UtcNow
          }
        });
      #endregion Schema Entity Properties
      #endregion SSI
    }
    #endregion Public Members

    #region Private Members
    private static void UpdatePresentation(MigrationBuilder migrationBuilder, string id, string group, int sortOrder)
    {
      migrationBuilder.UpdateData(
        schema: "SSI",
        table: "SchemaEntityProperty",
        keyColumn: "Id",
        keyValue: id,
        columns: PresentationColumns,
        values: [group, null, sortOrder]);
    }
    #endregion Private Members
  }
}
