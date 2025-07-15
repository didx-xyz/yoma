using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_UpdateArtifactType_AnonCredsToACR : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region SSI
      migrationBuilder.Sql("UPDATE \"SSI\".\"CredentialIssuance\" SET \"ArtifactType\" = 'ACR' WHERE \"ArtifactType\" = 'AnonCreds';");
      #endregion SSI
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      #region SSI
      migrationBuilder.Sql("UPDATE \"SSI\".\"CredentialIssuance\" SET \"ArtifactType\" = 'AnonCreds' WHERE \"ArtifactType\" = 'ACR';");
      #endregion
    }
  }
}
