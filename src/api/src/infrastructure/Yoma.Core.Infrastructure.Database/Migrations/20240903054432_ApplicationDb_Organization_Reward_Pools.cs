using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Organization_Reward_Pools : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardCumulative",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardPool",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "ZltoRewardCumulative",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "ZltoRewardPool",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      ApplicationDb_Organization_Reward_Pools_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "YomaRewardCumulative",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "YomaRewardPool",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "ZltoRewardCumulative",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "ZltoRewardPool",
          schema: "Entity",
          table: "Organization");
    }
  }
}
