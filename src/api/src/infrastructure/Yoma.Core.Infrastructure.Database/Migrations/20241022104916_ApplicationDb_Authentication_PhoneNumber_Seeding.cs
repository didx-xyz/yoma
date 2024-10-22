using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Authentication_PhoneNumber_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      #region Lookups
      // Update specific key in SettingsDefinition
      migrationBuilder.Sql(
          "UPDATE \"Entity\".\"SettingsDefinition\" " +
          "SET \"Key\" = 'User_Share_Contact_Info_With_Partners' " +
          "WHERE \"Key\" = 'User_Share_Email_With_Partners';");

      // Replace all occurrences of '_Email_' with '_Notification_' in the Key field
      migrationBuilder.Sql(
          "UPDATE \"Entity\".\"SettingsDefinition\" " +
          "SET \"Key\" = REPLACE(\"Key\", '_Email_', '_Notification_') " +
          "WHERE \"Key\" LIKE '%_Email_%';");

      // Update Title and Description to replace 'email' with 'contact information'
      migrationBuilder.Sql(
          "UPDATE \"Entity\".\"SettingsDefinition\" " +
          "SET \"Title\" = REPLACE(\"Title\", 'email', 'contact information'), " +
          "\"Description\" = REPLACE(\"Description\", 'email', 'contact information') " +
          "WHERE \"Key\" = 'User_Share_Contact_Info_With_Partners';");
      #endregion Lookups
      #endregion Entity

      #region User
      // Replace specific key 'User_Share_Email_With_Partners' with 'User_Share_Contact_Info_With_Partners' in the Settings field
      migrationBuilder.Sql(
          "UPDATE \"Entity\".\"User\" " +
          "SET \"Settings\" = REPLACE(\"Settings\", 'User_Share_Email_With_Partners', 'User_Share_Contact_Info_With_Partners') " +
          "WHERE \"Settings\" LIKE '%User_Share_Email_With_Partners%';");

      // Replace all occurrences of '_Email_' with '_Notification_' in the Settings field
      migrationBuilder.Sql(
          "UPDATE \"Entity\".\"User\" " +
          "SET \"Settings\" = REPLACE(\"Settings\", '_Email_', '_Notification_') " +
          "WHERE \"Settings\" LIKE '%_Email_%';");
      #endregion User

      #region Reward
      // Update Username field in WalletCreation table based on User email and StatusId
      migrationBuilder.Sql(
          "UPDATE \"Reward\".\"WalletCreation\" wc " +
          "SET \"Username\" = u.\"Email\" " +
          "FROM \"Entity\".\"User\" u " +
          "WHERE wc.\"UserId\" = u.\"Id\" " +
          "AND wc.\"StatusId\" = (SELECT \"Id\" FROM \"Reward\".\"WalletCreationStatus\" WHERE \"Name\" = 'Created');");

      #region Lookups
      migrationBuilder.InsertData(
        table: "WalletCreationStatus",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          {"3F7BE722-8994-4591-81A2-ACAA42905E2A","PendingUsernameUpdate",DateTimeOffset.UtcNow}
        },
        schema: "Reward");
      #endregion
      #endregion Reward
    }
  }
}

