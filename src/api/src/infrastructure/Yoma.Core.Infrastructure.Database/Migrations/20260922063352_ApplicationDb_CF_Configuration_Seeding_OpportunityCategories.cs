using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_OpportunityCategories
  {
    private const string ImageUrlBase = "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/";
    private static readonly string[] Columns_Name_ImageURL = ["Name", "ImageURL"];
    private static readonly string[] Columns_Id_Name_ImageURL_DateCreated = ["Id", "Name", "ImageURL", "DateCreated"];

    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      // Keep these locks and all seeders in EF's migration transaction. Pause writers/syncs;
      // NOWAIT fails rather than waiting behind live edits. Do not suppress the transaction.
      migrationBuilder.Sql("""
        LOCK TABLE "Opportunity"."Opportunity" IN SHARE ROW EXCLUSIVE MODE NOWAIT;
        LOCK TABLE "Opportunity"."OpportunityCategory" IN SHARE ROW EXCLUSIVE MODE NOWAIT;
        LOCK TABLE "Opportunity"."OpportunityCategories" IN SHARE ROW EXCLUSIVE MODE NOWAIT;

        DO $guard$
        BEGIN
          IF (SELECT COUNT(*) FROM "Opportunity"."OpportunityCategory") <> 10
            OR (SELECT COUNT(*) FROM "Opportunity"."OpportunityCategory" c
                JOIN (VALUES
                  ('2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950'::uuid, 'Agriculture'),
                  ('fa564c1c-591a-4a6d-8294-20165da8866b'::uuid, 'Technology and Digitization'),
                  ('c76786fd-fca9-4633-85b3-11e53486d708'::uuid, 'Business and Entrepreneurship'),
                  ('7afb66ad-164e-46a3-933f-a0bac1ca1923'::uuid, 'Creative Industry and Arts'),
                  ('6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71'::uuid, 'Health and Care'),
                  ('f36051c9-9057-4765-bc2f-9dee82ef60d6'::uuid, 'Tourism and Hospitality'),
                  ('89f4ab46-0767-494f-a18c-3037f698133a'::uuid, 'Career and Personal Development'),
                  ('d0d322ab-d1d7-44b6-94e8-7b85246aa42e'::uuid, 'Environment and Climate'),
                  ('1dc39a5d-e049-4cfe-b708-855fce97b86e'::uuid, 'AI, Data and Analytics'),
                  ('b89c5e91-9cbb-4a0e-991f-f987eebf9b70'::uuid, 'Other')
                ) expected("Id", "Name") ON c."Id" = expected."Id" AND c."Name" = expected."Name") <> 10 THEN
            RAISE EXCEPTION 'Category taxonomy migration requires the ten approved legacy category IDs and names; review unexpected data before retrying';
          END IF;
        END $guard$;
        """);

      // Rename in place: retained IDs and DateCreated remain unchanged.
      migrationBuilder.UpdateData(schema: "Opportunity", table: "OpportunityCategory",
        keyColumn: "Id", keyValue: new Guid("2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950"),
        columns: Columns_Name_ImageURL, values: ["Agriculture, Food, Environment and Climate", ImageUrlBase + "AgricultureFoodEnvironmentAndClimate.svg"]);
      migrationBuilder.UpdateData(schema: "Opportunity", table: "OpportunityCategory",
        keyColumn: "Id", keyValue: new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"),
        columns: Columns_Name_ImageURL, values: ["Technology, AI & Data", ImageUrlBase + "TechnologyAIAndData.svg"]);
      migrationBuilder.UpdateData(schema: "Opportunity", table: "OpportunityCategory",
        keyColumn: "Id", keyValue: new Guid("c76786fd-fca9-4633-85b3-11e53486d708"),
        columns: Columns_Name_ImageURL, values: ["Business, Finance & Marketing", ImageUrlBase + "BusinessFinanceAndMarketing.svg"]);
      migrationBuilder.UpdateData(schema: "Opportunity", table: "OpportunityCategory",
        keyColumn: "Id", keyValue: new Guid("7afb66ad-164e-46a3-933f-a0bac1ca1923"),
        columns: Columns_Name_ImageURL, values: ["Creative, Media & Design", ImageUrlBase + "CreativeMediaAndDesign.svg"]);
      migrationBuilder.UpdateData(schema: "Opportunity", table: "OpportunityCategory",
        keyColumn: "Id", keyValue: new Guid("6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71"),
        columns: Columns_Name_ImageURL, values: ["Health, Safety & Wellbeing", ImageUrlBase + "HealthSafetyAndWellbeing.svg"]);
      migrationBuilder.UpdateData(schema: "Opportunity", table: "OpportunityCategory",
        keyColumn: "Id", keyValue: new Guid("f36051c9-9057-4765-bc2f-9dee82ef60d6"),
        columns: Columns_Name_ImageURL, values: ["Hospitality & Tourism", ImageUrlBase + "HospitalityAndTourism.svg"]);
      migrationBuilder.UpdateData(schema: "Opportunity", table: "OpportunityCategory",
        keyColumn: "Id", keyValue: new Guid("89f4ab46-0767-494f-a18c-3037f698133a"),
        columns: Columns_Name_ImageURL, values: ["Personal Development & Career Readiness", ImageUrlBase + "PersonalDevelopmentAndCareerReadiness.svg"]);

      // New identities are fixed for all environments; Other and its existing image are untouched.
      migrationBuilder.InsertData(schema: "Opportunity", table: "OpportunityCategory",
        columns: Columns_Id_Name_ImageURL_DateCreated,
        values: new object[,]
        {
          { new Guid("15ba04a2-5b3d-4d40-aa20-62ea38c9769a"), "Engineering, Science & Mathematics", ImageUrlBase + "EngineeringScienceAndMathematics.svg", DateTimeOffset.UtcNow },
          { new Guid("45a18936-5965-4ffe-b12e-beeb81a40f34"), "Beauty & Personal Care", ImageUrlBase + "BeautyAndPersonalCare.svg", DateTimeOffset.UtcNow },
          { new Guid("be1c903e-87bb-41cd-8da4-1f2f286d7dc9"), "Languages & Communication", ImageUrlBase + "LanguagesAndCommunication.svg", DateTimeOffset.UtcNow },
          { new Guid("1612eb90-806b-40db-bc6e-a428780581dc"), "History, Society & Human Rights", ImageUrlBase + "HistorySocietyAndHumanRights.svg", DateTimeOffset.UtcNow },
          { new Guid("0529387f-b8fe-4166-ba03-54293370197f"), "Office, Admin & Professional Skills", ImageUrlBase + "OfficeAdminAndProfessionalSkills.svg", DateTimeOffset.UtcNow },
          { new Guid("1e8e59ae-4009-48ef-8c09-a72d6af068c7"), "Education & Teaching", ImageUrlBase + "EducationAndTeaching.svg", DateTimeOffset.UtcNow },
          { new Guid("944c4b9a-8dc8-4e18-8913-2a01461a4f9b"), "Law, Governance & Compliance", ImageUrlBase + "LawGovernanceAndCompliance.svg", DateTimeOffset.UtcNow },
          { new Guid("8a1778eb-0cd3-434c-bfb6-15788fd0b678"), "Retail & Food Services", ImageUrlBase + "RetailAndFoodServices.svg", DateTimeOffset.UtcNow }
        });
    }
  }
}

