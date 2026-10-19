using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <summary>
  /// Adds Contract employment and refreshes user-facing custom-field help through grouped seed classes.
  /// Existing option identities, selections and protection flags remain unchanged.
  /// </summary>
  public partial class ApplicationDb_Job_Employment_Contract : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region Custom Fields
      ApplicationDb_Job_Employment_Contract_Seeding.Seed(migrationBuilder);
      ApplicationDb_CF_UserFacing_HelpText_Seeding.Seed(migrationBuilder);
      #endregion
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      // Match the CF configuration's forward-only policy; never delete captured selections.
      throw new NotSupportedException("The Job employment metadata migration cannot be reversed safely; restore a pre-migration backup or apply a reviewed forward migration.");
    }
  }
}
