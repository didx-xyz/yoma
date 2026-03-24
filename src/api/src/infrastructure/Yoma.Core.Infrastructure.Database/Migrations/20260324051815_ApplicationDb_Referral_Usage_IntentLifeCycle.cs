using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Referral_Usage_IntentLifeCycle : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_LinkUsage_LinkId_StatusId_DateCreated_DateModified",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.AddColumn<DateTimeOffset>(
          name: "DateClaimed",
          schema: "Referral",
          table: "LinkUsage",
          type: "timestamp with time zone",
          nullable: true);

      migrationBuilder.AddColumn<DateTimeOffset>(
          name: "DateInitiated",
          schema: "Referral",
          table: "LinkUsage",
          type: "timestamp with time zone",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_LinkUsage_LinkId_StatusId_DateInitiated_DateClaimed_DateCre~",
          schema: "Referral",
          table: "LinkUsage",
          columns: ["LinkId", "StatusId", "DateInitiated", "DateClaimed", "DateCreated", "DateModified"]);

      Referral_Usage_IntentLifeCycle_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_LinkUsage_LinkId_StatusId_DateInitiated_DateClaimed_DateCre~",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropColumn(
          name: "DateClaimed",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropColumn(
          name: "DateInitiated",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.CreateIndex(
          name: "IX_LinkUsage_LinkId_StatusId_DateCreated_DateModified",
          schema: "Referral",
          table: "LinkUsage",
          columns: ["LinkId", "StatusId", "DateCreated", "DateModified"]);
    }
  }
}
