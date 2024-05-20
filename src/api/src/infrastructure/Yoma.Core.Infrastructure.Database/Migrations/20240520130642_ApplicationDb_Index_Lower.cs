using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Index_Lower : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("CREATE INDEX \"IX_User_Email_Lower\" ON \"Entity\".\"User\" (LOWER(\"Email\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_Organization_Name_Lower\" ON \"Entity\".\"Organization\" (LOWER(\"Name\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_Opportunity_Title_Lower\" ON \"Opportunity\".\"Opportunity\" (LOWER(\"Title\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_Skill_Name_Lower\" ON \"Lookup\".\"Skill\" (LOWER(\"Name\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_Link_Name_Lower\" ON \"ActionLink\".\"Link\" (LOWER(\"Name\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_UserLoginHistory_ClientId_Lower\" ON \"Entity\".\"UserLoginHistory\" (LOWER(\"ClientId\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_Transaction_SourceEntityType_Lower\" ON \"Reward\".\"Transaction\" (LOWER(\"SourceEntityType\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_TenantCreation_EntityType_Lower\" ON \"SSI\".\"TenantCreation\" (LOWER(\"EntityType\"));");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_User_Email_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Organization_Name_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Opportunity_Title_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Skill_Name_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Link_Name_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_UserLoginHistory_ClientId_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Transaction_SourceEntityType_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TenantCreation_EntityType_Lower\";");
    }
  }
}
