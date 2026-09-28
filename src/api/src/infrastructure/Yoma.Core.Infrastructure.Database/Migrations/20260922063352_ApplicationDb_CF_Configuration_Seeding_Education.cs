using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_Education
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      // Existing user EducationId values remain valid; only the lookup labels change.
      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "Education",
        keyColumn: "Id",
        keyValue: new Guid("2C0F0175-7007-40BF-9BF9-6D15B793BC09"),
        column: "Name",
        value: "Tertiary (Qualification not specified)");

      migrationBuilder.InsertData(
        schema: "Lookup",
        table: "Education",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          { new Guid("898220F9-1369-482E-881F-A0829C20401C"), "Tertiary - Certificate", DateTimeOffset.UtcNow },
          { new Guid("411FA393-9A65-41F1-9901-8E7BA39BC06C"), "Tertiary - Diploma", DateTimeOffset.UtcNow },
          { new Guid("D5FC0367-9D17-4DC2-A7D4-77D17E3C02AF"), "Tertiary - Bachelor’s Degree", DateTimeOffset.UtcNow },
          { new Guid("810F5181-492D-4466-81A2-DC71709B1171"), "Tertiary - Honours Degree", DateTimeOffset.UtcNow },
          { new Guid("28E84F2C-EE70-4E88-883E-EAFAEC396216"), "Tertiary - Master’s Degree", DateTimeOffset.UtcNow },
          { new Guid("F78D77CF-83A4-46DF-B145-8C0742CB9D09"), "Tertiary - PhD", DateTimeOffset.UtcNow }
        });
    }
  }
}
