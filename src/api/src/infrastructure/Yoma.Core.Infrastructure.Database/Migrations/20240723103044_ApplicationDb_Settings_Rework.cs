using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Settings_Rework : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<bool>(
          name: "Visible",
          schema: "Entity",
          table: "SettingsDefinition",
          type: "boolean",
          nullable: false,
          defaultValue: false);

      ApplicationDb_Settings_Rework_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "Visible",
          schema: "Entity",
          table: "SettingsDefinition");
    }
  }
}
