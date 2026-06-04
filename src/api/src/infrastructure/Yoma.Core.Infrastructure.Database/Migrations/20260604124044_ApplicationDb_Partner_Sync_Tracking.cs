using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_Tracking : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.RenameColumn(
          name: "FailedReason",
          schema: "PartnerSync",
          table: "Tracking",
          newName: "RunFailureReason");

      migrationBuilder.AddColumn<int>(
          name: "ItemsCreated",
          schema: "PartnerSync",
          table: "Tracking",
          type: "integer",
          nullable: true);

      migrationBuilder.AddColumn<int>(
          name: "ItemsUpdated",
          schema: "PartnerSync",
          table: "Tracking",
          type: "integer",
          nullable: true);

      migrationBuilder.AddColumn<int>(
          name: "ItemsDeleted",
          schema: "PartnerSync",
          table: "Tracking",
          type: "integer",
          nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "ItemsCreated",
          schema: "PartnerSync",
          table: "Tracking");

      migrationBuilder.DropColumn(
          name: "ItemsUpdated",
          schema: "PartnerSync",
          table: "Tracking");

      migrationBuilder.DropColumn(
          name: "ItemsDeleted",
          schema: "PartnerSync",
          table: "Tracking");

      migrationBuilder.RenameColumn(
          name: "RunFailureReason",
          schema: "PartnerSync",
          table: "Tracking",
          newName: "FailedReason");
    }
  }
}
