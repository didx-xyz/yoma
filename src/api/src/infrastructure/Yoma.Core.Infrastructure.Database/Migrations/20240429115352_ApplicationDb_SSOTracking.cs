using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_SSOTracking : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
          name: "SSOClientIdInbound",
          schema: "Entity",
          table: "Organization",
          type: "varchar(255)",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "SSOClientIdOutbound",
          schema: "Entity",
          table: "Organization",
          type: "varchar(255)",
          nullable: true);

      migrationBuilder.CreateTable(
          name: "UserLoginHistory",
          schema: "Entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            ClientId = table.Column<string>(type: "varchar(255)", nullable: false),
            IpAddress = table.Column<string>(type: "varchar(39)", nullable: true),
            AuthMethod = table.Column<string>(type: "varchar(255)", nullable: true),
            AuthType = table.Column<string>(type: "varchar(255)", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_UserLoginHistory", x => x.Id);
            table.ForeignKey(
                      name: "FK_UserLoginHistory_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_UserLoginHistory_UserId_ClientId_DateCreated",
          schema: "Entity",
          table: "UserLoginHistory",
          columns: ["UserId", "ClientId", "DateCreated"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "UserLoginHistory",
          schema: "Entity");

      migrationBuilder.DropColumn(
          name: "SSOClientIdInbound",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "SSOClientIdOutbound",
          schema: "Entity",
          table: "Organization");
    }
  }
}
