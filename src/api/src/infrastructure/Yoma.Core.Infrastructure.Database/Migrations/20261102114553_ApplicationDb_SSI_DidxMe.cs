using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  public partial class ApplicationDb_SSI_DidxMe : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region SSI
      migrationBuilder.AlterColumn<string>(
        name: "TenantId",
        schema: "SSI",
        table: "TenantCreation",
        type: "varchar(125)",
        nullable: true,
        oldClrType: typeof(string),
        oldType: "varchar(50)",
        oldNullable: true);

      ApplicationDb_SSI_DidxMe_Seeding_ProviderReset.Seed(migrationBuilder);
      #endregion SSI

      #region Core
      ApplicationDb_SSI_DidxMe_Seeding_CustomFields.Seed(migrationBuilder);
      #endregion Core
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      throw new NotSupportedException("SSI provider reset cannot restore the previous tenant and credential mappings; use the reviewed recovery procedure.");
    }
  }
}
