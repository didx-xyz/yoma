using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Settings_Organization_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      #region Lookups
      migrationBuilder.InsertData(
       table: "SettingsDefinition",
       columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled", "Visible"],
       values: new object?[,]
       {
          // Organization
          // Privacy
          { "6AFCE8D4-22EC-41B6-BDF9-CC7FE459A527", "Organization", "Organization_Share_Address_Details_With_Partners", "Share address details", "Share your address with integrated partners", "Privacy", null, 1, $"[]", "false", "Boolean", true, true },
          { "236D4C87-C58A-4926-B158-C4F0A6CECABC", "Organization", "Organization_Share_Contact_Info_With_Partners", "Share contact information", "Share your primary contact information with partners ", "Privacy", null , 2, $"[]", "false", "Boolean", true, true }
       },
       schema: "Entity");

      #endregion Lookups
      #endregion Entity
    }
  }
}
