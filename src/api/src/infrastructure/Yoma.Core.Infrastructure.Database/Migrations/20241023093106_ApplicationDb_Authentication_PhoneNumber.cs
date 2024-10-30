using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Authentication_PhoneNumber : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("UPDATE \"Entity\".\"User\" SET \"PhoneNumber\" = NULL");

      migrationBuilder.DropIndex(
          name: "IX_User_FirstName_Surname_EmailConfirmed_PhoneNumber_DateOfBir~",
          schema: "Entity",
          table: "User");

      migrationBuilder.AlterColumn<string>(
          name: "Name",
          schema: "Reward",
          table: "WalletCreationStatus",
          type: "varchar(50)",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(20)");

      migrationBuilder.AddColumn<string>(
          name: "Username",
          schema: "Reward",
          table: "WalletCreation",
          type: "varchar(320)",
          nullable: true);

      migrationBuilder.AlterColumn<string>(
          name: "Surname",
          schema: "Entity",
          table: "User",
          type: "varchar(125)",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "varchar(125)");

      migrationBuilder.AlterColumn<string>(
          name: "FirstName",
          schema: "Entity",
          table: "User",
          type: "varchar(125)",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "varchar(125)");

      migrationBuilder.AlterColumn<bool>(
          name: "EmailConfirmed",
          schema: "Entity",
          table: "User",
          type: "boolean",
          nullable: true,
          oldClrType: typeof(bool),
          oldType: "boolean");

      migrationBuilder.AlterColumn<string>(
          name: "Email",
          schema: "Entity",
          table: "User",
          type: "varchar(320)",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "varchar(320)");

      migrationBuilder.AlterColumn<string>(
          name: "DisplayName",
          schema: "Entity",
          table: "User",
          type: "varchar(255)",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "varchar(255)");

      migrationBuilder.AddColumn<bool>(
          name: "PhoneNumberConfirmed",
          schema: "Entity",
          table: "User",
          type: "boolean",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_WalletCreation_Username",
          schema: "Reward",
          table: "WalletCreation",
          column: "Username",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_ExternalId",
          schema: "Entity",
          table: "User",
          column: "ExternalId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_FirstName_Surname_DisplayName_EmailConfirmed_PhoneNumb~",
          schema: "Entity",
          table: "User",
          columns: ["FirstName", "Surname", "DisplayName", "EmailConfirmed", "PhoneNumberConfirmed", "DateOfBirth", "DateLastLogin", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_User_PhoneNumber",
          schema: "Entity",
          table: "User",
          column: "PhoneNumber",
          unique: true);

      ApplicationDb_Authentication_PhoneNumber_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_WalletCreation_Username",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropIndex(
          name: "IX_User_ExternalId",
          schema: "Entity",
          table: "User");

      migrationBuilder.DropIndex(
          name: "IX_User_FirstName_Surname_DisplayName_EmailConfirmed_PhoneNumb~",
          schema: "Entity",
          table: "User");

      migrationBuilder.DropIndex(
          name: "IX_User_PhoneNumber",
          schema: "Entity",
          table: "User");

      migrationBuilder.DropColumn(
          name: "Username",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropColumn(
          name: "PhoneNumberConfirmed",
          schema: "Entity",
          table: "User");

      migrationBuilder.AlterColumn<string>(
          name: "Name",
          schema: "Reward",
          table: "WalletCreationStatus",
          type: "varchar(20)",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(50)");

      migrationBuilder.AlterColumn<string>(
          name: "Surname",
          schema: "Entity",
          table: "User",
          type: "varchar(125)",
          nullable: false,
          defaultValue: "",
          oldClrType: typeof(string),
          oldType: "varchar(125)",
          oldNullable: true);

      migrationBuilder.AlterColumn<string>(
          name: "FirstName",
          schema: "Entity",
          table: "User",
          type: "varchar(125)",
          nullable: false,
          defaultValue: "",
          oldClrType: typeof(string),
          oldType: "varchar(125)",
          oldNullable: true);

      migrationBuilder.AlterColumn<bool>(
          name: "EmailConfirmed",
          schema: "Entity",
          table: "User",
          type: "boolean",
          nullable: false,
          defaultValue: false,
          oldClrType: typeof(bool),
          oldType: "boolean",
          oldNullable: true);

      migrationBuilder.AlterColumn<string>(
          name: "Email",
          schema: "Entity",
          table: "User",
          type: "varchar(320)",
          nullable: false,
          defaultValue: "",
          oldClrType: typeof(string),
          oldType: "varchar(320)",
          oldNullable: true);

      migrationBuilder.AlterColumn<string>(
          name: "DisplayName",
          schema: "Entity",
          table: "User",
          type: "varchar(255)",
          nullable: false,
          defaultValue: "",
          oldClrType: typeof(string),
          oldType: "varchar(255)",
          oldNullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_FirstName_Surname_EmailConfirmed_PhoneNumber_DateOfBir~",
          schema: "Entity",
          table: "User",
          columns: ["FirstName", "Surname", "EmailConfirmed", "PhoneNumber", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified"]);
    }
  }
}
