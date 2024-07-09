using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Settings_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      #region Lookups
      migrationBuilder.InsertData(
          table: "SettingsDefinition",
          columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled"],
          values: new object?[,]
          {
            // Email Preferences
            // Completions (Youth)
            { "3B6F3E2E-4A6D-4329-999B-61C9F86A3820", "User", "Email_Opportunity_Completion_Pending", "Opportunity completion pending", "Email sent when successfully applied for opportunity verification.", "Email Preferences", "Completions (Youth)", 1, $"[\"{Constants.Role_User}\"]", "true", "Boolean", false },
            { "4B4E6781-5D16-46D1-A7FA-709C82E5B7A1", "User", "Email_Opportunity_Completion_Accepted", "Opportunity completion accepted", "Email sent when the opportunity verification is accepted.", "Email Preferences", "Completions (Youth)", 2, $"[\"{Constants.Role_User}\"]", "true", "Boolean", false },
            { "9F0C7B4C-3C6C-4A5A-9578-65A5A5EBA9C3", "User", "Email_Opportunity_Completion_Rejected", "Opportunity completion rejected", "Email sent when the opportunity verification is rejected.", "Email Preferences", "Completions (Youth)", 3, $"[\"{Constants.Role_User}\"]", "true", "Boolean", false },

            // Organisation Approval (Organisation Administrator)
            { "0ABF9E3E-FAD0-478C-AF92-43ACD2D1E1B1", "User", "Email_Organization_Approval_Approved", "Organisation approval approved", "Email sent when the organisation approval request is approved.", "Email Preferences", "Organisation Approval (Organisation Administrator)", 4, $"[\"{Constants.Role_OrganizationAdmin}\"]", "true", "Boolean", true },
            { "5E4EBC2C-DA5B-49D8-8E39-C8C73C4B4C77", "User", "Email_Organization_Approval_Declined", "Organisation approval declined", "Email sent when the organisation approval request is declined.", "Email Preferences", "Organisation Approval (Organisation Administrator)", 5, $"[\"{Constants.Role_OrganizationAdmin}\"]", "true", "Boolean", true },

            // Expiring Opportunities (Organisation Administrator)
            { "710F5D22-0F2A-4DA3-8777-D9DF50E6B93A", "User", "Email_Opportunity_Expiration_WithinNextDays", "Opportunity expiring soon", "Email sent when an opportunity is expiring soon.", "Email Preferences", "Expiring Opportunities (Organisation Administrator)", 6, $"[\"{Constants.Role_OrganizationAdmin}\"]", "true", "Boolean", true },
            { "5A6E6D0B-1E44-4621-B84D-3D62D173F2C0", "User", "Email_Opportunity_Expiration_Expired", "Opportunity expired", "Email sent when an opportunity has expired.", "Email Preferences", "Expiring Opportunities (Organisation Administrator)", 7, $"[\"{Constants.Role_OrganizationAdmin}\"]", "true", "Boolean", true },

            // Completion requests (Organisation Administrator)
            { "AD2A2B6E-5E0A-420B-965B-EE3D35B4D43D", "User", "Email_Opportunity_Completion_Pending_Admin", "Opportunity completion pending", "Email sent when an opportunity verification is pending.", "Email Preferences", "Completion Requests (Organisation Administrator)", 8, $"[\"{Constants.Role_OrganizationAdmin}\"]", "false", "Boolean", true },

            // New organisations (Admin)
            { "927F4E8E-8FF4-4F60-AD65-258A7C3BB96A", "User", "Email_Organization_Approval_Requested", "Organisation approval requested", "Email sent when an organisation approval request is received.", "Email Preferences", "New Organisations (Admin)", 9, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true },

            // New opportunities (Admin)
            { "8DFEA39C-FE35-4974-95DE-C3E6E8B5C72B", "User", "Email_Opportunity_Posted_Admin", "New opportunity posted", "Email sent when a new opportunity is posted.", "Email Preferences", "New Opportunities (Admin)", 10, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true },

            // Information Sharing
            { "F3E6E3B1-0B3F-4B92-8C21-9E87A2D6A28F", "User", "Share_Email_With_Partners", "Share email with partners", "Share email with partners.", "Information Sharing", null, 11, $"[\"{Constants.Role_User}\"]", "false", "Boolean", true },

            // Newsletter
            { "E6FBD123-5820-4DB1-8C37-8A90B2A3E86F", "User", "Subscribe_To_Newsletter", "Subscribe to newsletter", "Subscribe to newsletter.", "Newsletter", null, 12, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true }
          },
          schema: "Entity");
      #endregion Lookups
      #endregion Entity
    }
  }
}
