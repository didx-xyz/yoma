using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Link_User_Keys_NoAction : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Link_User_CreatedByUserId",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_User_ModifiedByUserId",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.AddForeignKey(
          name: "FK_Link_User_CreatedByUserId",
          schema: "ActionLink",
          table: "Link",
          column: "CreatedByUserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Link_User_ModifiedByUserId",
          schema: "ActionLink",
          table: "Link",
          column: "ModifiedByUserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Link_User_CreatedByUserId",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_User_ModifiedByUserId",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.AddForeignKey(
          name: "FK_Link_User_CreatedByUserId",
          schema: "ActionLink",
          table: "Link",
          column: "CreatedByUserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Link_User_ModifiedByUserId",
          schema: "ActionLink",
          table: "Link",
          column: "ModifiedByUserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);
    }
  }
}
