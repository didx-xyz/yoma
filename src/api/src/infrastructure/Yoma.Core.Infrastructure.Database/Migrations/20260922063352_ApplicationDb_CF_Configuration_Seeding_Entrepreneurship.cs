using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_Entrepreneurship
  {
    #region Class Variables
    private static readonly string[] DefinitionColumns =
    [
      "Id", "EntityType", "EntityContext", "Key", "Title", "Description", "Group", "SubGroup",
      "DataType", "LookupType", "IsRequired", "SupportsMultiple", "ValidationRegex",
      "ValidationErrorMessage", "SortOrder", "IsActive", "IsSystem", "IsSchemaMapped",
      "DateCreated", "DateModified"
    ];

    private static readonly string[] OptionColumns =
    [
      "Id", "CustomFieldDefinitionId", "Key", "Name", "SortOrder",
      "IsActive", "DateCreated", "DateModified"
    ];
    #endregion

    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      var created = DateTimeOffset.UtcNow;

      #region Opportunity
      #region Custom Fields
      // Programme metadata is shared by participants. Venture facts belong to each
      // verified completion and are seeded separately below.
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldDefinition",
        columns: DefinitionColumns,
        values: new object[,]
        {
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000001"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            CustomFieldConstants.Entrepreneurship.Programme.Type, "Programme", "Programme under which this entrepreneurship opportunity is run. Select Other and describe an unlisted programme.",
            "Entrepreneurship details", "Programme", CustomFieldDataType.Option.ToString(), null!, false, false,
            null!, null!, 10, true, true, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000002"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            CustomFieldConstants.Entrepreneurship.Programme.OtherDescription, "Other programme", "Required only when Other is selected. Name the programme, up to 255 characters.",
            "Entrepreneurship details", "Programme", CustomFieldDataType.String.ToString(), null!, false, null!,
            @"\A[\s\S]{1,255}\z", "Other programme must be between 1 and 255 characters.", 20, true, true, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000003"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipVentureStageTargeted", "Venture stage targeted", "Stage the programme is designed for; this does not assert the stage reached by a participant.",
            "Entrepreneurship details", "Programme", CustomFieldDataType.Option.ToString(), null!, false, false,
            null!, null!, 30, true, false, false, created, created
          }
        });

      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldOption",
        columns: OptionColumns,
        values: new object[,]
        {
          { new Guid("cf0e0001-0929-4cf0-a100-000000000101"), new Guid("cf0e0001-0929-4cf0-a100-000000000001"), "BeGreen", "BeGreen", 10, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000102"), new Guid("cf0e0001-0929-4cf0-a100-000000000001"), "EKYAN", "EKYAN", 20, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000103"), new Guid("cf0e0001-0929-4cf0-a100-000000000001"), "JACompanyProgramme", "JA Company Programme", 30, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000104"), new Guid("cf0e0001-0929-4cf0-a100-000000000001"), "UmuziVentures", "Umuzi Ventures", 40, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000105"), new Guid("cf0e0001-0929-4cf0-a100-000000000001"), "SupaMotoAcademy", "SupaMoto Academy", 50, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000106"), new Guid("cf0e0001-0929-4cf0-a100-000000000001"), EntrepreneurshipProgrammeType.Other.ToString(), "Other", 60, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000107"), new Guid("cf0e0001-0929-4cf0-a100-000000000003"), "IdeaPreVenture", "Idea / pre-venture", 10, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000108"), new Guid("cf0e0001-0929-4cf0-a100-000000000003"), "InformalSelfEmployed", "Informal / self-employed", 20, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000109"), new Guid("cf0e0001-0929-4cf0-a100-000000000003"), "RegisteredEarlyStage", "Registered early-stage (under 2 years)", 30, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000110"), new Guid("cf0e0001-0929-4cf0-a100-000000000003"), "EstablishedGrowth", "Established / growth (2+ years)", 40, true, created, created }
        });
      #endregion
      #endregion

      #region MyOpportunity
      #region Custom Fields
      // These values describe one youth's verified venture outcome. Missing optional
      // partner/import values remain absent; no placeholder claims are manufactured.
      // Credential mapping follows with the type-specific schema in the final CF phase.
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldDefinition",
        columns: DefinitionColumns,
        values: new object[,]
        {
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000011"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipBusinessName", "Business / venture name", "Venture or trading name. Informal self-employment can use a descriptive trading name.",
            "Completion details", "Venture", CustomFieldDataType.String.ToString(), null!, true, null!,
            @"\A[\s\S]{1,255}\z", "Business / venture name must be between 1 and 255 characters.", 10, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000012"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipBusinessSummary", "Business summary", "Briefly describe what the venture does and who it serves, up to 300 characters.",
            "Completion details", "Venture", CustomFieldDataType.String.ToString(), null!, true, null!,
            @"\A[\s\S]{1,300}\z", "Business summary must be between 1 and 300 characters.", 20, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000013"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipBusinessRegistered", "Business registered", "Select No for an informal or unregistered venture; registration is not a condition of participation.",
            "Completion details", "Venture", CustomFieldDataType.Boolean.ToString(), null!, true, null!,
            null!, null!, 30, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000014"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipRegistrationReference", "Registration reference", "Optional registration number or document reference when the venture is registered. Never use a placeholder for an informal venture.",
            "Completion details", "Venture", CustomFieldDataType.String.ToString(), null!, false, null!,
            @"\A[\s\S]{1,125}\z", "Registration reference must be between 1 and 125 characters.", 40, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000015"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipSector", "Business sector", "Economic sector of this venture: UN ISIC Revision 5, Section level. Distinct from the programme's Opportunity category.",
            "Completion details", "Venture", CustomFieldDataType.Option.ToString(), null!, false, false,
            null!, null!, 50, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000016"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipJobsCreated", "Jobs created", "Number of jobs created by the venture, excluding the founder. Zero is a valid reported outcome.",
            "Completion details", "Outcomes", CustomFieldDataType.Integer.ToString(), null!, false, null!,
            @"\A(?:0|[1-9][0-9]*)\z", "Jobs created must be zero or a positive whole number.", 10, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000017"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipRevenueBand", "Monthly revenue band", "Monthly business revenue in USD-equivalent bands. Pre-revenue means no income yet; an omitted value means not reported.",
            "Completion details", "Outcomes", CustomFieldDataType.Option.ToString(), null!, false, false,
            null!, null!, 20, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000018"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipRevenueCurrency", "Revenue currency", "Currency in which the business earns revenue. Informational; the monthly band uses USD-equivalent thresholds.",
            "Completion details", "Outcomes", CustomFieldDataType.Option.ToString(), CustomFieldLookupType.Currency.ToString(), false, false,
            null!, null!, 30, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000019"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipFundingTypes", "Funding acquired", "Types of funding actually secured by the venture, when known. This does not represent funding merely applied for.",
            "Completion details", "Outcomes", CustomFieldDataType.Option.ToString(), null!, false, true,
            null!, null!, 40, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000020"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipFundingAmountBand", "Funding amount band", "Total funding secured, in USD-equivalent bands, when known.",
            "Completion details", "Outcomes", CustomFieldDataType.Option.ToString(), null!, false, false,
            null!, null!, 50, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000021"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipFunder", "Funder", "Name of the funder or funding programme, when known.",
            "Completion details", "Outcomes", CustomFieldDataType.String.ToString(), null!, false, null!,
            @"\A[\s\S]{1,255}\z", "Funder must be between 1 and 255 characters.", 60, true, false, false, created, created
          },
          {
            new Guid("cf0e0001-0929-4cf0-a100-000000000022"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Entrepreneurship.ToString(),
            "entrepreneurshipClientLocation", "Customer reach", "Broad reach of the venture's customers, not a precise business location.",
            "Completion details", "Outcomes", CustomFieldDataType.Option.ToString(), null!, false, false,
            null!, null!, 70, true, false, false, created, created
          }
        });

      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldOption",
        columns: OptionColumns,
        values: new object[,]
        {
          { new Guid("cf0e0001-0929-4cf0-a100-000000000201"), new Guid("cf0e0001-0929-4cf0-a100-000000000017"), "PreRevenue", "Pre-revenue", 10, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000202"), new Guid("cf0e0001-0929-4cf0-a100-000000000017"), "Under100", "Under $100 / month", 20, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000203"), new Guid("cf0e0001-0929-4cf0-a100-000000000017"), "From100To500", "$100–$500 / month", 30, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000204"), new Guid("cf0e0001-0929-4cf0-a100-000000000017"), "From500To2000", "$500–$2,000 / month", 40, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000205"), new Guid("cf0e0001-0929-4cf0-a100-000000000017"), "From2000To10000", "$2,000–$10,000 / month", 50, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000206"), new Guid("cf0e0001-0929-4cf0-a100-000000000017"), "Over10000", "Over $10,000 / month", 60, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000207"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "Grant", "Grant", 10, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000208"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "SeedAngel", "Seed / angel", 20, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000209"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "Equity", "Equity", 30, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000210"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "FormalLoan", "Loan (formal)", 40, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000211"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "CommunityFinance", "Community finance", 50, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000212"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "FamilyFriends", "Family & friends", 60, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000213"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "CompetitionPrize", "Competition prize", 70, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000214"), new Guid("cf0e0001-0929-4cf0-a100-000000000019"), "InKind", "In-kind", 80, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000215"), new Guid("cf0e0001-0929-4cf0-a100-000000000020"), "Under500", "Under $500", 10, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000216"), new Guid("cf0e0001-0929-4cf0-a100-000000000020"), "From500To2000", "$500–$2,000", 20, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000217"), new Guid("cf0e0001-0929-4cf0-a100-000000000020"), "From2000To10000", "$2,000–$10,000", 30, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000218"), new Guid("cf0e0001-0929-4cf0-a100-000000000020"), "From10000To50000", "$10,000–$50,000", 40, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000219"), new Guid("cf0e0001-0929-4cf0-a100-000000000020"), "Over50000", "Over $50,000", 50, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000220"), new Guid("cf0e0001-0929-4cf0-a100-000000000022"), "LocalCommunity", "Same community / local", 10, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000221"), new Guid("cf0e0001-0929-4cf0-a100-000000000022"), "Regional", "Regional (within country)", 20, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000222"), new Guid("cf0e0001-0929-4cf0-a100-000000000022"), "National", "National", 30, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000223"), new Guid("cf0e0001-0929-4cf0-a100-000000000022"), "CrossBorder", "Cross-border / regional trade", 40, true, created, created },
          { new Guid("cf0e0001-0929-4cf0-a100-000000000224"), new Guid("cf0e0001-0929-4cf0-a100-000000000022"), "InternationalOnline", "International / online export", 50, true, created, created }
        });

      // Reuse the seeded ISIC Section catalogue instead of maintaining a second copy
      // of the official classification in this migration. CF options remain definition-owned.
      migrationBuilder.Sql("""
        INSERT INTO "Core"."CustomFieldOption"
          ("Id", "CustomFieldDefinitionId", "Key", "Name", "SortOrder", "IsActive", "DateCreated", "DateModified")
        SELECT gen_random_uuid(), 'cf0e0001-0929-4cf0-a100-000000000015'::uuid,
          "Key", "Name", "SortOrder", "IsActive", "DateCreated", "DateModified"
        FROM "Core"."CustomFieldOption"
        WHERE "CustomFieldDefinitionId" = 'cf0b0001-0929-4cf0-a100-000000000012'::uuid;
        """);
      #endregion
      #endregion
    }
  }
}
