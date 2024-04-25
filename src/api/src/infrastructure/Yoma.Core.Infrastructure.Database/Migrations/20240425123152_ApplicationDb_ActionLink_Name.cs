using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_ActionLink_Name : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Link_EntityType_Action_StatusId_OpportunityId_DateEnd_DateC~",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.CreateIndex(
          name: "IX_Link_Name_EntityType_Action_StatusId_OpportunityId_DateEnd_~",
          schema: "ActionLink",
          table: "Link",
          columns: ["Name", "EntityType", "Action", "StatusId", "OpportunityId", "DateEnd", "DateCreated"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Link_Name_EntityType_Action_StatusId_OpportunityId_DateEnd_~",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.CreateIndex(
          name: "IX_Link_EntityType_Action_StatusId_OpportunityId_DateEnd_DateC~",
          schema: "ActionLink",
          table: "Link",
          columns: ["EntityType", "Action", "StatusId", "OpportunityId", "DateEnd", "DateCreated"]);
    }
  }
}
