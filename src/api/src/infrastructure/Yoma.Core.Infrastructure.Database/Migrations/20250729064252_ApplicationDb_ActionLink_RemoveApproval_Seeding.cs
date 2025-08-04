using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_ActionLink_RemoveApproval_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region ActionLink
      // update declined to deleted
      migrationBuilder.UpdateData(
        schema: "ActionLink",
        table: "Link",
        keyColumn: "StatusId",
        keyValue: Guid.Parse("00E03280-666A-4EAD-9F23-A883FA0D1186"),
        column: "StatusId",
        value: Guid.Parse("53AC01D5-6D8F-4186-B584-89085AB90D5A"));

      #region Lookups
      // remove declined status
      migrationBuilder.DeleteData(
        schema: "ActionLink",
        table: "Status",
        keyColumn: "Id",
        keyValue: Guid.Parse("00E03280-666A-4EAD-9F23-A883FA0D1186"));
      #endregion Lookups
      #endregion ActionLink

      #region Entity
      #region Lookups
      // delete Admin_Notification_ActionLink_Verify_Approval
      migrationBuilder.DeleteData(
          schema: "Entity",
          table: "SettingsDefinition",
          keyColumn: "Id",
          keyValue: Guid.Parse("A2623732-9934-4B87-80BE-B93C0190D523")
      );

      // rename Organization_Admin_Notification_ActionLink_Verify_Approval >> Organization_Admin_Notification_ActionLink_Verify_Activated
      migrationBuilder.UpdateData(
          schema: "Entity",
          table: "SettingsDefinition",
          keyColumn: "Id",
          keyValue: Guid.Parse("A2F95E7A-D2C4-4ACE-9D34-044966FD34F4"),
          columns: ["Key", "Description"],
          values:
          [
            "Organization_Admin_Notification_ActionLink_Verify_Activated",
            "Get notified when magic links are activated"
          ]
      );
      #endregion Lookups
      #region User
      // replace Organization_Admin_Notification_ActionLink_Verify_Approval key with the new Organization_Admin_Notification_ActionLink_Verify_Activated key
      migrationBuilder.Sql(
          "UPDATE \"Entity\".\"User\" " +
          "SET \"Settings\" = REPLACE(\"Settings\", 'Organization_Admin_Notification_ActionLink_Verify_Approval', 'Organization_Admin_Notification_ActionLink_Verify_Activated') " +
          "WHERE \"Settings\" LIKE '%Organization_Admin_Notification_ActionLink_Verify_Approval%';");

      // remove Admin_Notification_ActionLink_Verify_Approval from Settings (handles first, middle, last positions)
      migrationBuilder.Sql(@"
        UPDATE ""Entity"".""User""
        SET ""Settings"" = 
            TRIM(BOTH ',' FROM REGEXP_REPLACE(
                REGEXP_REPLACE(
                    ""Settings"",
                    '""Admin_Notification_ActionLink_Verify_Approval""\s*:\s*(true|false)\s*,?', '', 'gi'
                ),
                ',\s*}', '}', 'gi'
            ))
        WHERE ""Settings"" LIKE '%Admin_Notification_ActionLink_Verify_Approval%';");
      #endregion User
      #endregion Entity
    }
  }
}

