using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_CF_Configuration : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      ApplicationDb_CF_Configuration_Seeding_OpportunityCategories.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_OpportunityCategoryMappings.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      // Merged associations no longer identify their original source category. Never guess
      // or delete newly categorized data during rollback; use a reviewed forward fix/backup.
      throw new NotSupportedException("The category taxonomy merge cannot be reversed losslessly; restore a pre-migration backup or apply a reviewed forward migration.");
    }
  }
}
