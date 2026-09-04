using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static partial class ApplicationDb_SSI_Credential_Schema_Seeding
  {
    internal static void SeedSchemaEntityProperties(MigrationBuilder migrationBuilder)
    {
      #region Schema Entity Properties
      UpdatePresentation(migrationBuilder, new Guid("32447353-1698-467C-8B5D-AD85E89235B0"), "Contact Details", 1); // Email
      UpdatePresentation(migrationBuilder, new Guid("64D4CBEB-3692-4E39-AAA7-B704F46AFB6D"), "Contact Details", 2); // Phone Number

      UpdatePresentation(migrationBuilder, new Guid("D26B85E6-223E-48B6-A12F-6C2D0136DD2F"), "Personal Details", 1); // First Name
      UpdatePresentation(migrationBuilder, new Guid("F7D89C98-0447-42DF-8A2D-A369B9FBAEBA"), "Personal Details", 2); // Surname
      UpdatePresentation(migrationBuilder, new Guid("D56808D2-F3DB-4D82-AA5C-1FBA04C8E3BD"), "Personal Details", 3); // Date of Birth
      UpdatePresentation(migrationBuilder, new Guid("C26D9276-5F94-4BB3-94BA-67C435025708"), "Personal Details", 4); // Gender
      UpdatePresentation(migrationBuilder, new Guid("B88A8825-FC5A-4000-93FE-9406A7898C58"), "Personal Details", 5); // Education
      UpdatePresentation(migrationBuilder, new Guid("B14C9C34-4C89-4DAE-88AB-9D667BE2EF7F"), "Personal Details", 6); // Country

      UpdatePresentation(migrationBuilder, new Guid("755B1F54-1365-4D2F-AF29-8AEC57CC7B4C"), "Opportunity Details", 1); // Type
      UpdatePresentation(migrationBuilder, new Guid("FF423D0C-2E91-48A6-9245-28EEF6E96B01"), "Opportunity Details", 2); // Difficulty
      UpdatePresentation(migrationBuilder, new Guid("5FAD171F-3E8C-4DB5-86FA-C4029FE29F22"), "Opportunity Details", 3); // Summary
      UpdatePresentation(migrationBuilder, new Guid("F4BAA24B-463F-4B74-BA81-7CC5DCBE8DF5"), "Opportunity Details", 4); // Skills

      UpdatePresentation(migrationBuilder, new Guid("8AD09B9C-61A1-4A68-B401-E926DD84E9DC"), "Completion Details", 1); // Completion Date
      UpdatePresentation(migrationBuilder, new Guid("682974E4-7AAB-4060-8A27-426F91C02ADD"), "Completion Details", 2); // ZLTO Reward

      UpdatePresentation(migrationBuilder, new Guid("A3E3FF94-67E0-4A03-983F-8D3D5DF5B56A"), "Youth Details", 1); // User Display Name
      UpdatePresentation(migrationBuilder, new Guid("CB8DE9BF-4C7C-429E-9B99-D92C9C6D79A0"), "Youth Details", 2); // User Date of Birth
      #endregion Schema Entity Properties
    }

    private static void UpdatePresentation(MigrationBuilder migrationBuilder, Guid id, string group, int sortOrder)
    {
      migrationBuilder.UpdateData(
        schema: "SSI",
        table: "SchemaEntityProperty",
        keyColumn: "Id",
        keyValue: id,
        columns: ["Group", "SortOrder"],
        values: [group, sortOrder]);
    }
  }
}
