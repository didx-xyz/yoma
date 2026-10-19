using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Jobberman.Migrations
{
  /// <inheritdoc />
  public partial class JobbermanDb_Opportunity_Summary : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
          name: "Summary",
          schema: "Jobberman",
          table: "Opportunity",
          type: "text",
          nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "Summary",
          schema: "Jobberman",
          table: "Opportunity");
    }
  }
}
