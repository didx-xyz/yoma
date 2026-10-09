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
    #endregion Class Variables

    #region Public Members
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region SSI
      #region Schema Entity Properties
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
            "Countries.LocationDisplayName", "Opportunity location",
            "Country, region and city where the opportunity is offered; not evidence of the youth's physical location.",
            false, null, null, "Opportunity Details", null, 10, DateTimeOffset.UtcNow
          },
          {
            "7df0110b-6fef-46c0-87de-c0a573b0999b", "E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D",
            "EngagementType", "Engagement type",
            "Declared remote, on-site or hybrid engagement; separate from opportunity location.",
            false, null, null, "Opportunity Details", null, 20, DateTimeOffset.UtcNow
          },
          {
            "cabd88de-1b10-4b79-bae9-dfe3e8862dde", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "CommitmentIntervalDescription", "Participation commitment",
            "Recorded participation commitment and unit; not an independently verified measure of time spent.",
            false, null, null, "Participation", null, 20, DateTimeOffset.UtcNow
          },
          {
            "db902ae7-7f9a-439b-90bf-e883af5b43f9", "CA11D9D0-39F6-46D8-A0D3-350EC41402F5",
            "Verifications.VerificationTypeDisplayName", "Evidence types submitted",
            "Types of evidence actually submitted; excludes file links, geometry and configured but unused evidence types.",
            false, null, null, "Verification", null, 10, DateTimeOffset.UtcNow
          }
        });
      #endregion Schema Entity Properties
      #endregion SSI
    }
    #endregion Public Members
  }
}
