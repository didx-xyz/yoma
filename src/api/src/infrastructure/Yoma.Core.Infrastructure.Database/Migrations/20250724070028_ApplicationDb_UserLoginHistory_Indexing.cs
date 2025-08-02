using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_UserLoginHistory_Indexing : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_UserLoginHistory_UserId_ClientId_DateCreated",
          schema: "Entity",
          table: "UserLoginHistory");

      migrationBuilder.CreateIndex(
          name: "IX_UserLoginHistory_UserId_ClientId_IdentityProvider_DateCreat~",
          schema: "Entity",
          table: "UserLoginHistory",
          columns: ["UserId", "ClientId", "IdentityProvider", "DateCreated"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_UserLoginHistory_UserId_ClientId_IdentityProvider_DateCreat~",
          schema: "Entity",
          table: "UserLoginHistory");

      migrationBuilder.CreateIndex(
          name: "IX_UserLoginHistory_UserId_ClientId_DateCreated",
          schema: "Entity",
          table: "UserLoginHistory",
          columns: ["UserId", "ClientId", "DateCreated"]);
    }
  }
}
