using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_SSI_DidxMe_Seeding_CustomFields
  {
    public static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Core
      // Job cards rely on this stable key to display the required education level.
      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValue: new Guid("cf0b0001-0929-4cf0-a100-000000000010"),
        column: "IsSystem",
        value: true);

      // Keep definition IDs, values and options. Recreate credential schemas/presets at the didx:me cutover.
      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValue: new Guid("cf0e0001-0929-4cf0-a100-000000000002"),
        column: "Key",
        value: "EntrepreneurshipProgrammeOther");

      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValue: new Guid("cf0e0001-0929-4cf0-a100-000000000014"),
        column: "Key",
        value: "EntrepreneurshipRegistrationRef");
      #endregion Core
    }

    public static void Revert(MigrationBuilder migrationBuilder)
    {
      #region Core
      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValue: new Guid("cf0e0001-0929-4cf0-a100-000000000002"),
        column: "Key",
        value: "EntrepreneurshipProgrammeOtherDescription");

      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValue: new Guid("cf0e0001-0929-4cf0-a100-000000000014"),
        column: "Key",
        value: "EntrepreneurshipRegistrationReference");
      #endregion Core
    }
  }
}
