using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_SSI_Credential_Replay : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region SSI - Credential Issuance
      migrationBuilder.AddColumn<DateTimeOffset>(
          name: "DateIssued",
          schema: "SSI",
          table: "CredentialIssuance",
          type: "timestamp with time zone",
          nullable: true);

      ApplicationDb_SSI_Credential_Replay_Seeding.Seed(migrationBuilder);
      #endregion
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      throw new NotSupportedException("Credential Replay cannot be reversed safely once cleanup has run; apply a reviewed forward migration.");
    }
  }
}
