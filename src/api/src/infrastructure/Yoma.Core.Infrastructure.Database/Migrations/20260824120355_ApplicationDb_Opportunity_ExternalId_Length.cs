using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Opportunity_ExternalId_Length : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterColumn<string>(
        name: "ExternalId",
        schema: "Opportunity",
        table: "Opportunity",
        type: "varchar(100)",
        nullable: true,
        oldClrType: typeof(string),
        oldType: "varchar(50)",
        oldNullable: true);

      migrationBuilder.AlterColumn<string>(
        name: "EntityExternalId",
        schema: "PartnerSync",
        table: "ProcessingLog",
        type: "varchar(512)",
        nullable: true,
        oldClrType: typeof(string),
        oldType: "varchar(50)",
        oldNullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterColumn<string>(
        name: "EntityExternalId",
        schema: "PartnerSync",
        table: "ProcessingLog",
        type: "varchar(50)",
        nullable: true,
        oldClrType: typeof(string),
        oldType: "varchar(512)",
        oldNullable: true);

      migrationBuilder.AlterColumn<string>(
        name: "ExternalId",
        schema: "Opportunity",
        table: "Opportunity",
        type: "varchar(50)",
        nullable: true,
        oldClrType: typeof(string),
        oldType: "varchar(100)",
        oldNullable: true);
    }
  }
}
