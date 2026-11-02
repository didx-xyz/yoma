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
      #endregion SSI

      #region Core
      ApplicationDb_SSI_DidxMe_Seeding_CustomFields.Seed(migrationBuilder);
      #endregion Core
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      #region Core
      ApplicationDb_SSI_DidxMe_Seeding_CustomFields.Revert(migrationBuilder);
      #endregion Core

      #region SSI
      // Never truncate an existing provider identity when narrowing the column.
      migrationBuilder.Sql("""
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM "SSI"."TenantCreation" WHERE length("TenantId") > 50) THEN
            RAISE EXCEPTION 'Cannot narrow SSI.TenantCreation.TenantId: values exceed 50 characters';
          END IF;
        END $$;
        """);

      migrationBuilder.AlterColumn<string>(
        name: "TenantId",
        schema: "SSI",
        table: "TenantCreation",
        type: "varchar(50)",
        nullable: true,
        oldClrType: typeof(string),
        oldType: "varchar(125)",
        oldNullable: true);
      #endregion SSI
    }
  }
}
