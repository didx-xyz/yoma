using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class Settings_User_Rework_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      #region Lookups
      // NOTE: Referral settings were only deployed up to Stage before the rework. User settings were manually reset on Stage to remove outdated referral entries

      // Remove old referral settings
      migrationBuilder.DeleteData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "User_Referrer_Notification_ReferralLink_Completed_Awarded");
      migrationBuilder.DeleteData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "User_Referrer_Notification_Referral_AccessChange");
      migrationBuilder.DeleteData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "User_Referee_Notification_ReferralUsage_Welcome");
      migrationBuilder.DeleteData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "User_Referee_Notification_ReferralUsage_Completed");
      migrationBuilder.DeleteData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Admin_Notification_ReferralProgram_Expiration");
      migrationBuilder.DeleteData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Admin_Notification_ReferralProgram_UnCompletable");

      // Re-order existing settings
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "User_MailingList_Subscribe", column: "Order", value: 6);
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Organization_Admin_Notification_Opportunity_Expiration", column: "Order", value: 7);
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Organization_Admin_Notification_Organization_Approval", column: "Order", value: 8);
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Organization_Admin_Notification_Opportunity_Completion", column: "Order", value: 9);
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Organization_Admin_Notification_ActionLink_Verify_Activated", column: "Order", value: 10);
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Admin_Notification_Opportunity_Posted", column: "Order", value: 11);
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "Admin_Notification_Organization_Approval", column: "Order", value: 12);
      migrationBuilder.UpdateData(table: "SettingsDefinition", schema: "Entity", keyColumn: "Key", keyValue: "User_Share_Contact_Info_With_Partners", column: "Order", value: 14);

      // Insert new referral and rum settings
      migrationBuilder.InsertData(
        table: "SettingsDefinition", schema: "Entity",
        columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled", "Visible"],
        values: new object?[,]
        {
          {
            "6C9BC28C-1F4B-4C01-8C71-4E2C9F8F2F11","User","User_Notifications_Referrals","Referrals",
            "Updates on referral activity, progress, and rewards",
            "Notifications","General",5,$"[\"User\"]","true","Boolean",true,true
          },
          {
            "9C5B4C40-6B8E-4F8D-9B36-8F0A1C9EF5AA","User","Admin_Notifications_Referrals","Referral admin",
            "Notifications for admins about referral activity, completions, and items needing attention",
            "Notifications","Admin",13,$"[\"Admin\"]","true","Boolean",true,true
          },
          {
            "D9EE75CC-1190-4BBA-BEB0-4E25BA4A9C11","User","User_RumConsent","Platform Performance Monitoring",
            "Allow Yoma to monitor site performance to improve your experience",
            "Privacy",null,15,$"[\"User\"]","false","Boolean",true,true
          }
        });
      #endregion Lookups
      #endregion Entity
    }
  }
}
