using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_PartnerSync_User : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.CreateTable(
          name: "User",
          schema: "PartnerSync",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            PartnerId = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            Username = table.Column<string>(type: "text", nullable: false),
            Email = table.Column<string>(type: "text", nullable: true),
            PhoneNumber = table.Column<string>(type: "text", nullable: true),
            ExternalId = table.Column<string>(type: "text", nullable: true),
            DateLastRedirect = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_PartnerSync_User", x => x.Id);
            table.ForeignKey(
                      name: "FK_PartnerSync_User_Entity_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_PartnerSync_User_Partner_PartnerId",
                      column: x => x.PartnerId,
                      principalSchema: "PartnerSync",
                      principalTable: "Partner",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_Email",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "Email"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_ExternalId",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "ExternalId"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_PhoneNumber",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "PhoneNumber"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_UserId",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "UserId"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_Username",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "Username"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_Username_Email_PhoneNumber_ExternalId_DateCr~",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "Username", "Email", "PhoneNumber", "ExternalId", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_User_UserId",
          schema: "PartnerSync",
          table: "User",
          column: "UserId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "User",
          schema: "PartnerSync");
    }
  }
}
