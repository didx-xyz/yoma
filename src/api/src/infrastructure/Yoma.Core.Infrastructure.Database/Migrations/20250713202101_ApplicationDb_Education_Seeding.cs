using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Education_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Lookups
      #region Education
      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "Education",
        keyColumn: "Id",
        keyValue: new Guid("BEEBEA3B-381E-4BD8-91D8-319089AB14DA"),
        column: "Name",
        value: "Primary (Grade 1–7 or equivalent)");

      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "Education",
        keyColumn: "Id",
        keyValue: new Guid("5642E521-34B9-4DC8-BFFA-B975F5C95D99"),
        column: "Name",
        value: "Secondary (Grade 8–12, Matric or equivalent)");

      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "Education",
        keyColumn: "Id",
        keyValue: new Guid("2C0F0175-7007-40BF-9BF9-6D15B793BC09"),
        column: "Name",
        value: "Tertiary (Diploma, Degree or equivalent)");

      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "Education",
        keyColumn: "Id",
        keyValue: new Guid("D306BEA3-04AA-4778-969F-4F92DA45559E"),
        column: "Name",
        value: "No formal education (No schooling attended)");

      migrationBuilder.InsertData(
        schema: "Lookup",
        table: "Education",
        columns: ["Id", "Name", "DateCreated"],
        values:
        [
          new Guid("D0DDBF9F-6AF1-46BE-9465-BD6B8D47B752"),
          "Other",
          DateTimeOffset.UtcNow
        ]);

      #endregion Education
      #endregion Lookups
    }
  }
}
