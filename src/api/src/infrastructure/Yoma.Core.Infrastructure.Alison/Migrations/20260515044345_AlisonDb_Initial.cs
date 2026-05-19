using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Alison.Migrations
{
  /// <inheritdoc />
  public partial class AlisonDb_Initial : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.EnsureSchema(
          name: "Alison");

      migrationBuilder.CreateTable(
          name: "Opportunity",
          schema: "Alison",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ExternalId = table.Column<string>(type: "varchar(50)", nullable: false),
            PayloadHash = table.Column<string>(type: "varchar(128)", nullable: false),
            PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
            Deleted = table.Column<bool>(type: "boolean", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Opportunity", x => x.Id);
          });

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_Deleted_DateModified",
          schema: "Alison",
          table: "Opportunity",
          columns: ["Deleted", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId",
          schema: "Alison",
          table: "Opportunity",
          column: "ExternalId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId_DateCreated_DateModified",
          schema: "Alison",
          table: "Opportunity",
          columns: ["ExternalId", "DateCreated", "DateModified"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "Opportunity",
          schema: "Alison");
    }
  }
}
