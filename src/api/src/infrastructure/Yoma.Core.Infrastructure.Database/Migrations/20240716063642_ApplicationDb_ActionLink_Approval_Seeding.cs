using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_ActionLink_Approval_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region ActionLink
      migrationBuilder.InsertData(
      table: "Status",
      columns: ["Id", "Name", "DateCreated"],
      values: new object[,]
      {
        {"00E03280-666A-4EAD-9F23-A883FA0D1186","Declined",DateTimeOffset.UtcNow}
        ,
        {"53AC01D5-6D8F-4186-B584-89085AB90D5A","Deleted",DateTimeOffset.UtcNow}
      },
      schema: "ActionLink");
      #endregion ActionLink

      #region Entity
      #region Lookups
      migrationBuilder.InsertData(
          table: "SettingsDefinition",
          columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled"],
          values: new object?[,]
          {
            // ActionLink Verify Approval (Organisation Administrator)
            { "A2F95E7A-D2C4-4ACE-9D34-044966FD34F4", "User", "Email_ActionLink_Verify_Approval_Approved", "Verify link approval approved", "Email sent when the verify link approval request is approved.", "Email Preferences", "Verify Link Approval (Organisation Administrator)", 13, $"[\"{Constants.Role_OrganizationAdmin}\"]", "true", "Boolean", true },
            { "9E945AA8-19A9-4047-AE84-9DC41175478C", "User", "Email_ActionLink_Verify_Approval_Declined", "Verify link approval declined", "Email sent when the verify link approval request is declined.", "Email Preferences", "Verify Link Approval (Organisation Administrator)", 14, $"[\"{Constants.Role_OrganizationAdmin}\"]", "true", "Boolean", true },

            // New ActionLink Verify (Admin)
            { "A2623732-9934-4B87-80BE-B93C0190D523", "User", "Email_ActionLink_Verify_Approval_Requested", "Verify link approval requested", "Email sent when an verify link approval request is received.", "Email Preferences", "New Verify Link (Admin)", 15, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true },
          },
          schema: "Entity");
      #endregion Lookups
      #endregion Entity

    }
  }
}
