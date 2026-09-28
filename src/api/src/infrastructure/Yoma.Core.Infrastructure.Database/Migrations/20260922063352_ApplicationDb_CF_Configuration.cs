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
      migrationBuilder.AddColumn<string>(name: "Region", schema: "Entity", table: "User", type: "varchar(255)", nullable: true);
      migrationBuilder.AddColumn<string>(name: "City", schema: "Entity", table: "User", type: "varchar(255)", nullable: true);
      migrationBuilder.AddColumn<string>(name: "Coordinates", schema: "Entity", table: "User", type: "jsonb", nullable: true);
      migrationBuilder.AddColumn<string>(name: "LocationSource", schema: "Entity", table: "User", type: "varchar(25)", nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "Type",
        schema: "Entity",
        table: "UserSkills",
        type: "varchar(25)",
        nullable: false,
        defaultValue: "Verified");

      migrationBuilder.AddColumn<DateTimeOffset>(
        name: "DateModified",
        schema: "Entity",
        table: "UserSkills",
        type: "timestamp with time zone",
        nullable: true);

      migrationBuilder.Sql("UPDATE \"Entity\".\"UserSkills\" SET \"DateModified\" = \"DateCreated\"");

      migrationBuilder.AlterColumn<DateTimeOffset>(
        name: "DateModified",
        schema: "Entity",
        table: "UserSkills",
        type: "timestamp with time zone",
        nullable: false,
        oldClrType: typeof(DateTimeOffset),
        oldType: "timestamp with time zone",
        oldNullable: true);

      migrationBuilder.CreateTable(
        name: "UserGoal",
        schema: "Entity",
        columns: table => new
        {
          Id = table.Column<Guid>(type: "uuid", nullable: false),
          Name = table.Column<string>(type: "varchar(125)", nullable: false),
          DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table => table.PrimaryKey("PK_UserGoal", x => x.Id));

      migrationBuilder.CreateIndex(
        name: "IX_UserGoal_Name",
        schema: "Entity",
        table: "UserGoal",
        column: "Name",
        unique: true);

      migrationBuilder.CreateTable(
        name: "UserPreferences",
        schema: "Entity",
        columns: table => new
        {
          UserId = table.Column<Guid>(type: "uuid", nullable: false),
          GoalId = table.Column<Guid>(type: "uuid", nullable: true),
          CommitmentIntervalId = table.Column<Guid>(type: "uuid", nullable: true),
          CommitmentIntervalCount = table.Column<short>(type: "smallint", nullable: true),
          EngagementTypeId = table.Column<Guid>(type: "uuid", nullable: true),
          Incentivized = table.Column<bool>(type: "boolean", nullable: true),
          AccessibilityRequirementOtherDescription = table.Column<string>(type: "varchar(500)", nullable: true),
          DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
          DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_UserPreferences", x => x.UserId);
          table.ForeignKey(name: "FK_UserPreferences_User_UserId", column: x => x.UserId, principalSchema: "Entity", principalTable: "User", principalColumn: "Id");
          table.ForeignKey(name: "FK_UserPreferences_UserGoal_GoalId", column: x => x.GoalId, principalSchema: "Entity", principalTable: "UserGoal", principalColumn: "Id");
          table.ForeignKey(name: "FK_UserPreferences_TimeInterval_CommitmentIntervalId", column: x => x.CommitmentIntervalId, principalSchema: "Lookup", principalTable: "TimeInterval", principalColumn: "Id");
          table.ForeignKey(name: "FK_UserPreferences_EngagementType_EngagementTypeId", column: x => x.EngagementTypeId, principalSchema: "Lookup", principalTable: "EngagementType", principalColumn: "Id");
        });

      migrationBuilder.CreateIndex(name: "IX_UserPreferences_GoalId", schema: "Entity", table: "UserPreferences", column: "GoalId");
      migrationBuilder.CreateIndex(name: "IX_UserPreferences_CommitmentIntervalId", schema: "Entity", table: "UserPreferences", column: "CommitmentIntervalId");
      migrationBuilder.CreateIndex(name: "IX_UserPreferences_EngagementTypeId", schema: "Entity", table: "UserPreferences", column: "EngagementTypeId");

      migrationBuilder.CreateTable(
        name: "UserPreferenceCategories",
        schema: "Entity",
        columns: table => new
        {
          Id = table.Column<Guid>(type: "uuid", nullable: false),
          UserId = table.Column<Guid>(type: "uuid", nullable: false),
          CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
          DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_UserPreferenceCategories", x => x.Id);
          table.ForeignKey(name: "FK_UserPreferenceCategories_OpportunityCategory_CategoryId", column: x => x.CategoryId, principalSchema: "Opportunity", principalTable: "OpportunityCategory", principalColumn: "Id");
          table.ForeignKey(name: "FK_UserPreferenceCategories_UserPreferences_UserId", column: x => x.UserId, principalSchema: "Entity", principalTable: "UserPreferences", principalColumn: "UserId");
        });

      migrationBuilder.CreateIndex(name: "IX_UserPreferenceCategories_CategoryId", schema: "Entity", table: "UserPreferenceCategories", column: "CategoryId");
      migrationBuilder.CreateIndex(name: "IX_UserPreferenceCategories_UserId_CategoryId", schema: "Entity", table: "UserPreferenceCategories", columns: ["UserId", "CategoryId"], unique: true);

      migrationBuilder.CreateTable(
        name: "Accessibility",
        schema: "Lookup",
        columns: table => new
        {
          Id = table.Column<Guid>(type: "uuid", nullable: false),
          Name = table.Column<string>(type: "varchar(125)", nullable: false),
          DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table => table.PrimaryKey("PK_Accessibility", x => x.Id));

      migrationBuilder.CreateIndex(
        name: "IX_Accessibility_Name",
        schema: "Lookup",
        table: "Accessibility",
        column: "Name",
        unique: true);

      migrationBuilder.CreateTable(
        name: "UserPreferenceAccessibilityRequirements",
        schema: "Entity",
        columns: table => new
        {
          Id = table.Column<Guid>(type: "uuid", nullable: false),
          UserId = table.Column<Guid>(type: "uuid", nullable: false),
          AccessibilityId = table.Column<Guid>(type: "uuid", nullable: false),
          DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_UserPreferenceAccessibilityRequirements", x => x.Id);
          table.ForeignKey(
            name: "FK_UserPreferenceAccessibilityRequirements_Accessibility_A~",
            column: x => x.AccessibilityId,
            principalSchema: "Lookup",
            principalTable: "Accessibility",
            principalColumn: "Id");
          table.ForeignKey(
            name: "FK_UserPreferenceAccessibilityRequirements_UserPreferences_UserId",
            column: x => x.UserId,
            principalSchema: "Entity",
            principalTable: "UserPreferences",
            principalColumn: "UserId");
        });

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceAccessibilityRequirements_AccessibilityId",
        schema: "Entity",
        table: "UserPreferenceAccessibilityRequirements",
        column: "AccessibilityId");

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceAccessibilityRequirements_UserId_AccessibilityId",
        schema: "Entity",
        table: "UserPreferenceAccessibilityRequirements",
        columns: ["UserId", "AccessibilityId"],
        unique: true);

      migrationBuilder.CreateTable(
        name: "UserPreferenceLanguages",
        schema: "Entity",
        columns: table => new
        {
          Id = table.Column<Guid>(type: "uuid", nullable: false),
          UserId = table.Column<Guid>(type: "uuid", nullable: false),
          LanguageId = table.Column<Guid>(type: "uuid", nullable: false),
          DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_UserPreferenceLanguages", x => x.Id);
          table.ForeignKey(name: "FK_UserPreferenceLanguages_UserPreferences_UserId", column: x => x.UserId,
            principalSchema: "Entity", principalTable: "UserPreferences", principalColumn: "UserId");
          table.ForeignKey(name: "FK_UserPreferenceLanguages_Language_LanguageId", column: x => x.LanguageId,
            principalSchema: "Lookup", principalTable: "Language", principalColumn: "Id");
        });

      migrationBuilder.CreateIndex(name: "IX_UserPreferenceLanguages_LanguageId", schema: "Entity",
        table: "UserPreferenceLanguages", column: "LanguageId");
      migrationBuilder.CreateIndex(name: "IX_UserPreferenceLanguages_UserId_LanguageId", schema: "Entity",
        table: "UserPreferenceLanguages", columns: ["UserId", "LanguageId"], unique: true);

      migrationBuilder.AddColumn<string>(
        name: "DisplayName",
        schema: "Lookup",
        table: "EngagementType",
        type: "varchar(125)",
        nullable: true);

      ApplicationDb_CF_Configuration_Seeding_OpportunityTypes.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_OpportunityCategories.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_OpportunityCategoryMappings.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_Education.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_UserGoals.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_Accessibility.Seed(migrationBuilder);
      ApplicationDb_CF_Configuration_Seeding_EngagementTypes.Seed(migrationBuilder);

      migrationBuilder.Sql("UPDATE \"Lookup\".\"EngagementType\" SET \"DisplayName\" = \"Name\" WHERE \"DisplayName\" IS NULL");
      migrationBuilder.AlterColumn<string>(
        name: "DisplayName",
        schema: "Lookup",
        table: "EngagementType",
        type: "varchar(125)",
        nullable: false,
        oldClrType: typeof(string),
        oldType: "varchar(125)",
        oldNullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      // This configuration migration includes data changes that cannot be reversed losslessly.
      throw new NotSupportedException("The CF configuration migration cannot be reversed safely; restore a pre-migration backup or apply a reviewed forward migration.");
    }
  }
}
