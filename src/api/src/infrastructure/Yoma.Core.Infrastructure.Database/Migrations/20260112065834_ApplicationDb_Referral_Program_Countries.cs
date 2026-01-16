using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Referral_Program_Countries : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.CreateTable(
          name: "ProgramCountries",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ProgramId = table.Column<Guid>(type: "uuid", nullable: false),
            CountryId = table.Column<Guid>(type: "uuid", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_ProgramCountries", x => x.Id);
            table.ForeignKey(
                      name: "FK_ProgramCountries_Country_CountryId",
                      column: x => x.CountryId,
                      principalSchema: "Lookup",
                      principalTable: "Country",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_ProgramCountries_Program_ProgramId",
                      column: x => x.ProgramId,
                      principalSchema: "Referral",
                      principalTable: "Program",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_ProgramCountries_CountryId",
          schema: "Referral",
          table: "ProgramCountries",
          column: "CountryId");

      migrationBuilder.CreateIndex(
          name: "IX_ProgramCountries_ProgramId_CountryId",
          schema: "Referral",
          table: "ProgramCountries",
          columns: ["ProgramId", "CountryId"],
          unique: true);

      Referral_Program_Countries_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "ProgramCountries",
          schema: "Referral");
    }
  }
}
