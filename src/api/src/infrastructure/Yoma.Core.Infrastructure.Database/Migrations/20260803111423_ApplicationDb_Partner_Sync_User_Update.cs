using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_User_Update : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_User_PartnerId_Email",
          schema: "PartnerSync",
          table: "User");

      migrationBuilder.DropIndex(
          name: "IX_User_PartnerId_PhoneNumber",
          schema: "PartnerSync",
          table: "User");

      migrationBuilder.DropIndex(
          name: "IX_User_PartnerId_Username",
          schema: "PartnerSync",
          table: "User");

      migrationBuilder.DropIndex(
          name: "IX_User_PartnerId_Username_Email_PhoneNumber_ExternalId_DateCr~",
          schema: "PartnerSync",
          table: "User");

      migrationBuilder.DropColumn(
          name: "Email",
          schema: "PartnerSync",
          table: "User");

      migrationBuilder.DropColumn(
          name: "PhoneNumber",
          schema: "PartnerSync",
          table: "User");

      migrationBuilder.DropColumn(
          name: "Username",
          schema: "PartnerSync",
          table: "User");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
          name: "Email",
          schema: "PartnerSync",
          table: "User",
          type: "text",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "PhoneNumber",
          schema: "PartnerSync",
          table: "User",
          type: "text",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "Username",
          schema: "PartnerSync",
          table: "User",
          type: "text",
          nullable: true);

      migrationBuilder.Sql(
          """
          UPDATE "PartnerSync"."User" AS psu
          SET "Email" = u."Email",
              "PhoneNumber" = u."PhoneNumber",
              "Username" = COALESCE(u."Email", u."PhoneNumber", psu."UserId"::text)
          FROM "Entity"."User" AS u
          WHERE u."Id" = psu."UserId";
          """);

      migrationBuilder.AlterColumn<string>(
          name: "Username",
          schema: "PartnerSync",
          table: "User",
          type: "text",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "text",
          oldNullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_Email",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "Email"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_PartnerId_PhoneNumber",
          schema: "PartnerSync",
          table: "User",
          columns: ["PartnerId", "PhoneNumber"],
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
    }
  }
}
