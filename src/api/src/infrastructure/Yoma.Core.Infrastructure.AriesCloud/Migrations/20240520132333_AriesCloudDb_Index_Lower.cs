using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.AriesCloud.Migrations
{
  /// <inheritdoc />
  public partial class AriesCloudDb_Index_Lower : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("CREATE INDEX \"IX_Connection_Email_Protocol\" ON \"AriesCloud\".\"Connection\" (LOWER(\"Protocol\"));");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("CREATE INDEX \"IX_Connection_Email_Protocol\" ON \"Entity\".\"User\" (LOWER(\"Email\"));");
    }
  }
}
