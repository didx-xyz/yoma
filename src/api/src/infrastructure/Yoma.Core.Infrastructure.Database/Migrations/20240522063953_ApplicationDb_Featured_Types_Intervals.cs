using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Featured_Types_Intervals : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<bool>(
          name: "Featured",
          schema: "Opportunity",
          table: "Opportunity",
          type: "boolean",
          nullable: true);

      ApplicationDb_Featured_Types_Intervals_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "Featured",
          schema: "Opportunity",
          table: "Opportunity");
    }
  }
}
