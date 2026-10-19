using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Jobberman.Migrations
{
  public partial class JobbermanDb_Opportunity_FeedMetadata : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
        name: "Salary",
        schema: "Jobberman",
        table: "Opportunity",
        type: "text",
        nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "ExperienceLevel",
        schema: "Jobberman",
        table: "Opportunity",
        type: "text",
        nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "ExperienceLength",
        schema: "Jobberman",
        table: "Opportunity",
        type: "text",
        nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "MinimumQualification",
        schema: "Jobberman",
        table: "Opportunity",
        type: "text",
        nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
        name: "Salary",
        schema: "Jobberman",
        table: "Opportunity");

      migrationBuilder.DropColumn(
        name: "ExperienceLevel",
        schema: "Jobberman",
        table: "Opportunity");

      migrationBuilder.DropColumn(
        name: "ExperienceLength",
        schema: "Jobberman",
        table: "Opportunity");

      migrationBuilder.DropColumn(
        name: "MinimumQualification",
        schema: "Jobberman",
        table: "Opportunity");
    }
  }
}
