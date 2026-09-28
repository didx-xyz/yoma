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
      ApplicationDb_CF_Configuration_Seeding_OpportunityTypes.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_OpportunityCategories.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_OpportunityCategoryMappings.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      // This configuration migration includes data changes that cannot be reversed losslessly.
      throw new NotSupportedException("The CF configuration migration cannot be reversed safely; restore a pre-migration backup or apply a reviewed forward migration.");
    }
  }
}
