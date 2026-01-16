using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class Referral_Program_Countries_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      #region Lookups
      migrationBuilder.UpdateData(
        schema: "Entity",
        table: "SettingsDefinition",
        keyColumn: "Key",
        keyValue: "User_RumConsent",
        columns: ["Title", "Description"],
        values:
        [
            "Help us improve Yoma",
            "Allow Yoma to monitor platform performance to improve your experience"
        ]);

      migrationBuilder.UpdateData(
        schema: "Entity",
        table: "SettingsDefinition",
        keyColumn: "Key",
        keyValue: "Admin_Notifications_Referrals",
        column: "Title",
        value: "Referral admin");

      migrationBuilder.UpdateData(
        schema: "Entity",
        table: "SettingsDefinition",
        keyColumn: "Key",
        keyValue: "User_PopUp_LeavingYoma",
        column: "Description",
        value: "A user has opted to hide the pop up when leaving the Yoma app");

      migrationBuilder.UpdateData(
        schema: "Entity",
        table: "SettingsDefinition",
        keyColumn: "Key",
        keyValue: "Organization_Share_Contact_Info_With_Partners",
        column: "Description",
        value: "Share your primary contact information with partners");
      #endregion Lookups
      #endregion Entity
    }
  }
}
