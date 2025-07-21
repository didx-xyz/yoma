using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_User_ExternalIdpLinked : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
          name: "IdentityProvider",
          schema: "Entity",
          table: "UserLoginHistory",
          type: "varchar(100)",
          nullable: true);

      migrationBuilder.AddColumn<bool>(
          name: "ExternalIdpLinked",
          schema: "Entity",
          table: "User",
          type: "boolean",
          nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "IdentityProvider",
          schema: "Entity",
          table: "UserLoginHistory");

      migrationBuilder.DropColumn(
          name: "ExternalIdpLinked",
          schema: "Entity",
          table: "User");
    }
  }
}
