using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_UserDisplayName_ResetAll : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("UPDATE \"Entity\".\"User\" SET \"DisplayName\" = NULLIF(CONCAT_WS(' ', NULLIF(BTRIM(\"FirstName\"), ''), NULLIF(BTRIM(\"Surname\"), '')), '');");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {

    }
  }
}
