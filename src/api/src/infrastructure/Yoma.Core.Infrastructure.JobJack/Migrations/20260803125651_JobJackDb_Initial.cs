using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.JobJack.Migrations
{
  /// <inheritdoc />
  public partial class JobJackDb_Initial : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.EnsureSchema(
          name: "JobJack");

      migrationBuilder.CreateTable(
          name: "FeedSyncTracking",
          schema: "JobJack",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ETag = table.Column<string>(type: "varchar(512)", nullable: true),
            FeedLastModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_FeedSyncTracking", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Opportunity",
          schema: "JobJack",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ExternalId = table.Column<string>(type: "varchar(50)", nullable: false),
            Title = table.Column<string>(type: "varchar(512)", nullable: false),
            Company = table.Column<string>(type: "varchar(256)", nullable: true),
            Description = table.Column<string>(type: "text", nullable: true),
            Requirements = table.Column<string>(type: "text", nullable: true),
            Location = table.Column<string>(type: "varchar(512)", nullable: true),
            City = table.Column<string>(type: "varchar(100)", nullable: true),
            Province = table.Column<string>(type: "varchar(100)", nullable: true),
            ContractType = table.Column<string>(type: "varchar(100)", nullable: true),
            OpportunitiesAvailable = table.Column<int>(type: "integer", nullable: true),
            URL = table.Column<string>(type: "varchar(2048)", nullable: true),
            SalaryLow = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
            SalaryHigh = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
            SalaryFrequency = table.Column<string>(type: "varchar(100)", nullable: true),
            SalaryType = table.Column<string>(type: "varchar(256)", nullable: true),
            SalaryAdditional = table.Column<string>(type: "varchar(512)", nullable: true),
            Duration = table.Column<string>(type: "varchar(100)", nullable: true),
            DateStart = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            EmploymentStartDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            Category = table.Column<string>(type: "varchar(512)", nullable: true),
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
          schema: "JobJack",
          table: "Opportunity",
          columns: ["Deleted", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId",
          schema: "JobJack",
          table: "Opportunity",
          column: "ExternalId",
          unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "FeedSyncTracking",
          schema: "JobJack");

      migrationBuilder.DropTable(
          name: "Opportunity",
          schema: "JobJack");
    }
  }
}
