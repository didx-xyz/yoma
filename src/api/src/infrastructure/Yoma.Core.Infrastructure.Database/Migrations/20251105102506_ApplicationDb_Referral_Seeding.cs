using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Referral_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      #region Lookups
      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "User_MailingList_Subscribe",
          column: "Order",
          value: 9
      );

      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "Organization_Admin_Notification_Opportunity_Expiration",
          column: "Order",
          value: 10
      );

      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "Organization_Admin_Notification_Organization_Approval",
          column: "Order",
          value: 11
      );

      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "Organization_Admin_Notification_Opportunity_Completion",
          column: "Order",
          value: 12
      );

      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "Organization_Admin_Notification_ActionLink_Verify_Activated",
          column: "Order",
          value: 13
      );

      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "Admin_Notification_Opportunity_Posted",
          column: "Order",
          value: 14
      );

      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "Admin_Notification_Organization_Approval",
          column: "Order",
          value: 15
      );

      migrationBuilder.UpdateData(
          table: "SettingsDefinition",
          schema: "Entity",
          keyColumn: "Key",
          keyValue: "User_Share_Contact_Info_With_Partners",
          column: "Order",
          value: 18
      );

      migrationBuilder.InsertData(
        table: "SettingsDefinition",
        columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled", "Visible"],
        values: new object?[,]
        {
          // Notifications: Referrals (Youth / Referrer)
          { "4A7D9D94-4B94-40C0-96EE-8B147B6FA1E7", "User", "User_Referrer_Notification_ReferralLink_Completed_Awarded", "Referral completed", "Notify when someone you referred completes the program and you earn a reward", "Notifications", "General", 5, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true, true },
          { "78A34A2C-7A34-4C5C-8BBF-248E24D9F6E2", "User", "User_Referrer_Notification_Referral_AccessChange", "Referral access changed", "Notify when your referral access is blocked or restored", "Notifications", "General", 6, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true, true },

          // Notifications: Referrals (Youth / Referee)
          { "CD46C821-7169-4EF6-AFD2-147A21E45A17", "User", "User_Referee_Notification_ReferralUsage_Welcome", "Referral welcome", "Sent after claiming a referral link with instructions and next steps", "Notifications", "General", 7, $"[\"{Constants.Role_User}\"]", "true", "Boolean", false, false },
          { "AC2310A8-93A4-4C2E-A97F-9FE81B70D64B", "User", "User_Referee_Notification_ReferralUsage_Completed", "Referral complete", "Sent when the referee completes the program, including their reward", "Notifications", "General", 8, $"[\"{Constants.Role_User}\"]", "true", "Boolean", false, false },

          // Notifications: Referrals (Admin)
          { "C7E10477-87E2-4D0F-8128-7F7277ACF731", "User", "Admin_Notification_ReferralProgram_Expiration", "Program expiring", "Notify when a referral program nears its end date or expires", "Notifications", "Admin", 16, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true, true },
          { "E1C9B472-463C-4B1F-BE7E-CE394AF28C38", "User", "Admin_Notification_ReferralProgram_UnCompletable", "Program un-completable", "Notify when a referral program becomes un-completable and requires fixing", "Notifications", "Admin", 17, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true, true },

        },
        schema: "Entity");
      #endregion Lookups
      #endregion Entity

      #region Referral
      #region Lookups
      migrationBuilder.InsertData(
        schema: "Referral",
        table: "BlockReason",
        columns: ["Id", "Name", "Description", "DateCreated"],
        values: new object[,]
        {
          { new Guid("7F39B1A0-2F8E-4E7B-BF7D-5F66AFD2A1A1"), "Fraudulent Activity", "User engaged in fraudulent or suspicious referral behavior.", DateTimeOffset.UtcNow },
          { new Guid("A2F4C8D1-AB6E-47F2-9A6A-7EAD9F2BEF11"), "Multiple Accounts", "User created or operated multiple accounts to gain unfair referral rewards.", DateTimeOffset.UtcNow },
          { new Guid("B921D7D0-6180-4C57-A0E5-97F4EAF2A70B"), "Abusive Behavior", "User exhibited harassment, abuse, or policy violations during referrals.", DateTimeOffset.UtcNow },
          { new Guid("C6A9A52D-8A5E-493E-9A3D-AC7F8D7F8E22"), "Spam or Misuse", "User misused referral links for spam, advertising, or unauthorized purposes.", DateTimeOffset.UtcNow },
          { new Guid("D879E1A5-0C41-48C5-BDA2-1E42C39DF7B3"), "Data Manipulation", "User attempted to alter referral data or bypass verification mechanisms.", DateTimeOffset.UtcNow },
          { new Guid("F34C9B28-4F87-4FA5-A83C-24ACB90E5B12"), "Impersonation", "User impersonated another person or entity to obtain referral benefits.", DateTimeOffset.UtcNow },
          { new Guid("C2A4C926-3B31-44B2-8A0C-8EBB59C8E9D9"), "Violation of Terms", "User violated program terms, conditions, or community guidelines.", DateTimeOffset.UtcNow },
          { new Guid("BA69B4B1-2F33-46BE-8FA8-13C03E7A8F20"), "Misrepresentation", "User provided false or misleading information in referral activities.", DateTimeOffset.UtcNow },
          { new Guid("E44271F4-2783-4CE1-81F3-9B6C7488CFA0"), "Security Risk", "User’s behavior was flagged as a security or trust risk.", DateTimeOffset.UtcNow },
          { new Guid("D879E1A5-0C41-48C5-BDA2-1E42C39DF7C9"), "Other", "Other reason not listed; see block comment for details.", DateTimeOffset.UtcNow }
        });


      migrationBuilder.InsertData(
        table: "LinkStatus",
        columns: ["Id", "Name", "DateCreated"],
        values: new object?[,]
        {
          {"D71B9DEE-1320-45BE-89C9-5A6297BB0869","Active",DateTimeOffset.UtcNow}
          ,
          {"2061B074-7091-484C-9464-EF2FD125688E","Cancelled",DateTimeOffset.UtcNow}
          ,
          {"E00F4531-3BE2-47D0-8DF4-147E430AE129","LimitReached",DateTimeOffset.UtcNow}
          ,
          {"DDFB15B3-8EEF-48A5-B314-173FC911D7D2","Expired",DateTimeOffset.UtcNow}
        },
        schema: "Referral");

      migrationBuilder.InsertData(
       table: "LinkUsageStatus",
       columns: ["Id", "Name", "DateCreated"],
       values: new object?[,]
       {
          {"5AB91387-691F-4809-8D5A-D093C3A2639D","Pending",DateTimeOffset.UtcNow}
          ,
          {"E80DD95B-8C35-4F3F-9463-88C376C17ECD","Completed",DateTimeOffset.UtcNow}
          ,
          {"C2524F2C-A93D-440A-842B-F57FD2AAA9F1","Expired",DateTimeOffset.UtcNow}
       },
       schema: "Referral");

      migrationBuilder.InsertData(
       table: "ProgramStatus",
       columns: ["Id", "Name", "DateCreated"],
       values: new object?[,]
       {
          {"E322B386-15EC-4C46-A65F-D9F9BC4BE21D","Active",DateTimeOffset.UtcNow}
          ,
          {"53B67BF9-2B3E-4601-A8A3-66D3F8261C1E","Inactive",DateTimeOffset.UtcNow}
          ,
          {"D6E34140-A511-4BF9-945C-81ECAB794BCF","Expired",DateTimeOffset.UtcNow}
          ,
          {"69B129FD-697A-42F4-8E08-7D203E8D1A8A","LimitReached",DateTimeOffset.UtcNow}
          ,
          {"E44210AF-F269-415A-BD09-CE17727AF39B","UnCompletable",DateTimeOffset.UtcNow}
          ,
          {"9E7282E1-A3CE-4F8C-9BC2-B9B44E3FAC6C","Deleted",DateTimeOffset.UtcNow}
       },
       schema: "Referral");
      #endregion Lookups
      #endregion Referral
    }
  }
}
