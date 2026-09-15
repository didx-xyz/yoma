using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static partial class ApplicationDb_Custom_Fields_Treasury_Payout_SSI_Seeding
  {
    #region Internal Members
    internal static void SeedSettings(MigrationBuilder migrationBuilder)
    {
      // SettingsHelper supplies this default for existing users without changing saved preferences.
      migrationBuilder.InsertData(
        schema: "Entity", table: "SettingsDefinition",
        columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled", "Visible"],
        values:
        [
          "035c5da1-c6b2-48fc-8703-51becc8a74ab", "User", "User_Notifications_Payouts", "Cash-outs",
          "Updates when your cash-out completes, is cancelled, expires or fails",
          "Notifications", "General", (short)16, "[\"User\"]", "true", "Boolean", true, true
        ]);
    }

    internal static void UnseedSettings(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DeleteData(
        schema: "Entity", table: "SettingsDefinition",
        keyColumn: "Key", keyValue: "User_Notifications_Payouts");
    }
    #endregion
  }
}
