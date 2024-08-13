using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Settings_Rework_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      #region Lookups
      migrationBuilder.Sql("DELETE FROM \"Entity\".\"SettingsDefinition\"");

      migrationBuilder.InsertData(
        table: "SettingsDefinition",
        columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled", "Visible"],
        values: new object?[,]
        {
          // User
          // Display
          { "3B6F3E2E-4A6D-4329-999B-61C9F86A3820", "User", "User_Settings_Configured", "Configured settings", "A user has configured their settings", "Display", null, 1, $"[\"{Constants.Role_User}\"]", "false", "Boolean", true, false },
          { "FE13ECF7-0136-4F5A-9BFD-85BCD31868EF", "User", "User_PopUp_LeavingYoma", "Hide 'leaving Yoma' pop up", "A user has opted to hide the pop up when leaving the Yoma app ", "Display", null, 2, $"[\"{Constants.Role_User}\"]", "false", "Boolean", true, false },

          // Notifications: General
          { "8DFEA39C-FE35-4974-95DE-C3E6E8B5C72B", "User", "User_Email_Opportunity_Published", "New opportunities", "Get notified about new relevant opportunities", "Notifications", "General", 3, $"[\"{Constants.Role_User}\"]", "false", "Boolean", true , true},
          { "DA42922D-89CE-4C7C-9CB7-59843FABC087", "User", "User_Email_Opportunity_Completion", "Verification status", "Get notified when the status of your verifications change", "Notifications", "General", 4, $"[\"{Constants.Role_User}\"]", "true", "Boolean", false , false},
          { "E6FBD123-5820-4DB1-8C37-8A90B2A3E86F", "User", "User_MailingList_Subscribe", "Mailing list", "Subscribe to our mailing list", "Notifications", "General", 5, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true , true},

          // Notifications: Organisations
          { "710F5D22-0F2A-4DA3-8777-D9DF50E6B93A", "User", "Organization_Admin_Email_Opportunity_Expiration", "Opportunity expiring", "Get notified about opportunities that are expiring", "Notifications", "Organisation", 6, $"[\"{Constants.Role_OrganizationAdmin}\"]", "false", "Boolean", true , true},
          { "0ABF9E3E-FAD0-478C-AF92-43ACD2D1E1B1", "User", "Organization_Admin_Email_Organization_Approval", "Organisation status", "Get notified when the organisation status changes", "Notifications", "Organisation", 7, $"[\"{Constants.Role_OrganizationAdmin}\"]", "true", "Boolean", false, false },
          { "AD2A2B6E-5E0A-420B-965B-EE3D35B4D43D", "User", "Organization_Admin_Email_Opportunity_Completion", "Verification requests", "Get notified when there are new verification requests", "Notifications", "Organisation", 8, $"[\"{Constants.Role_OrganizationAdmin}\"]", "false", "Boolean", true, true },
          { "A2F95E7A-D2C4-4ACE-9D34-044966FD34F4", "User", "Organization_Admin_Email_ActionLink_Verify_Approval", "Magic links", "Get notified when a magic link's status is updated", "Notifications", "Organisation", 9, $"[\"{Constants.Role_OrganizationAdmin}\"]", "false", "Boolean", true , true},
  
          // Notifications: Admin
          { "F29F217E-A230-4A86-A451-E4EE9A8AE7F9", "User", "Admin_Email_Opportunity_Posted", "New opportunities", "Get notified about new opportunities", "Notifications", "Admin", 10, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true, true },
          { "927F4E8E-8FF4-4F60-AD65-258A7C3BB96A", "User", "Admin_Email_Organization_Approval", "New organisations", "Get notified about new organisation requests", "Notifications", "Admin", 11, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true, true },
          { "A2623732-9934-4B87-80BE-B93C0190D523", "User", "Admin_Email_ActionLink_Verify_Approval", "New magic links", "Get notified about new magic link requests", "Notifications", "Admin", 12, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true, true },

          // Privacy
          { "F3E6E3B1-0B3F-4B92-8C21-9E87A2D6A28F", "User", "User_Share_Email_With_Partners", "Share my email", "Recommended to share email, only with partners that you have completed opportunities with", "Privacy", null, 13, $"[\"{Constants.Role_User}\"]", "false", "Boolean", true, true },
        },
        schema: "Entity");
      #endregion Lookups

      #region User
      migrationBuilder.Sql("UPDATE \"Entity\".\"User\" SET \"Settings\" = NULL");
      #endregion User
      #endregion Entity
    }
  }
}
