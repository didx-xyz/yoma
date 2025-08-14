using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_UpdateDownloadScheduleType_OpporunitiesToOpportunities : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("UPDATE \"Download\".\"Schedule\" SET \"Type\" = 'Opportunities' WHERE \"Type\" = 'Opporunities';");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("UPDATE \"Download\".\"Schedule\" SET \"Type\" = 'Opporunities' WHERE \"Type\" = 'Opportunities';");
    }
  }
}
