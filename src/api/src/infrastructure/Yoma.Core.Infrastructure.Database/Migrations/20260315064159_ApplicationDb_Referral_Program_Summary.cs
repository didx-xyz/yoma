using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Referral_Program_Summary : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Program_Description_StatusId_IsDefault_Hidden_DateStart_Dat~",
          schema: "Referral",
          table: "Program");

      migrationBuilder.AlterColumn<string>(
          name: "Description",
          schema: "Referral",
          table: "Program",
          type: "text",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "varchar(500)",
          oldNullable: true);

      migrationBuilder.AddColumn<string>(
          name: "Summary",
          schema: "Referral",
          table: "Program",
          type: "varchar(500)",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_Program_Description",
          schema: "Referral",
          table: "Program",
          column: "Description")
          .Annotation("Npgsql:IndexMethod", "GIN")
          .Annotation("Npgsql:TsVectorConfig", "english");

      migrationBuilder.CreateIndex(
          name: "IX_Program_Summary_StatusId_IsDefault_Hidden_DateStart_DateEnd~",
          schema: "Referral",
          table: "Program",
          columns: ["Summary", "StatusId", "IsDefault", "Hidden", "DateStart", "DateEnd", "DateCreated", "DateModified"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Program_Description",
          schema: "Referral",
          table: "Program");

      migrationBuilder.DropIndex(
          name: "IX_Program_Summary_StatusId_IsDefault_Hidden_DateStart_DateEnd~",
          schema: "Referral",
          table: "Program");

      migrationBuilder.DropColumn(
          name: "Summary",
          schema: "Referral",
          table: "Program");

      migrationBuilder.AlterColumn<string>(
          name: "Description",
          schema: "Referral",
          table: "Program",
          type: "varchar(500)",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "text",
          oldNullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_Program_Description_StatusId_IsDefault_Hidden_DateStart_Dat~",
          schema: "Referral",
          table: "Program",
          columns: ["Description", "StatusId", "IsDefault", "Hidden", "DateStart", "DateEnd", "DateCreated", "DateModified"]);
    }
  }
}
