using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Education : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterColumn<string>(
          name: "Name",
          schema: "Lookup",
          table: "Education",
          type: "varchar(125)",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(20)");

      ApplicationDb_Education_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterColumn<string>(
          name: "Name",
          schema: "Lookup",
          table: "Education",
          type: "varchar(20)",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(125)");
    }
  }
}
