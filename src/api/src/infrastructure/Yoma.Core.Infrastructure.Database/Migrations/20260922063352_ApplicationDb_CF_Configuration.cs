using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_CF_Configuration : Migration
  {
    private static readonly string[] OpportunitySearchIndexColumns =
    [
      "TypeId", "OrganizationId", "ZltoReward", "CommitmentIntervalId", "CommitmentIntervalCount",
      "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "Featured",
      "EngagementTypeId", "ShareWithPartners", "Hidden", "DateCreated", "CreatedByUserId",
      "DateModified", "ModifiedByUserId"
    ];

    private static readonly string[] TrigramIndexOperators = ["gin_trgm_ops"];
    private static readonly string[] AccommodationIndexColumns = ["OpportunityId", "AccommodationId"];
    private static readonly string[] TargetedGroupIndexColumns = ["OpportunityId", "TargetedGroupId"];
    private static readonly string[] SustainableDevelopmentGoalIndexColumns = ["OpportunityId", "SustainableDevelopmentGoalId"];

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterDatabase()
        .Annotation("Npgsql:PostgresExtension:postgis", ",,")
        .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,")
        .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,");

      migrationBuilder.AddColumn<string>(
        name: "Region",
        schema: "Opportunity",
        table: "OpportunityCountries",
        type: "varchar(255)",
        nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "City",
        schema: "Opportunity",
        table: "OpportunityCountries",
        type: "varchar(255)",
        nullable: true);

      migrationBuilder.AddColumn<NetTopologySuite.Geometries.Point>(
        name: "Coordinates",
        schema: "Opportunity",
        table: "OpportunityCountries",
        type: "geography (point, 4326)",
        nullable: true);

      migrationBuilder.CreateIndex(
        name: "IX_OpportunityCountries_Coordinates",
        schema: "Opportunity",
        table: "OpportunityCountries",
        column: "Coordinates")
        .Annotation("Npgsql:IndexMethod", "gist");

      migrationBuilder.CreateIndex(
        name: "IX_OpportunityCountries_Region",
        schema: "Opportunity",
        table: "OpportunityCountries",
        column: "Region")
        .Annotation("Npgsql:IndexMethod", "gin")
        .Annotation("Npgsql:IndexOperators", TrigramIndexOperators);

      migrationBuilder.CreateIndex(
        name: "IX_OpportunityCountries_City",
        schema: "Opportunity",
        table: "OpportunityCountries",
        column: "City")
        .Annotation("Npgsql:IndexMethod", "gin")
        .Annotation("Npgsql:IndexOperators", TrigramIndexOperators);

      migrationBuilder.AddColumn<DateTimeOffset>(
        name: "DateModified",
        schema: "Opportunity",
        table: "OpportunityCountries",
        type: "timestamp with time zone",
        nullable: true);

      migrationBuilder.Sql("UPDATE \"Opportunity\".\"OpportunityCountries\" SET \"DateModified\" = \"DateCreated\"");

      migrationBuilder.AlterColumn<DateTimeOffset>(
        name: "DateModified",
        schema: "Opportunity",
        table: "OpportunityCountries",
        type: "timestamp with time zone",
        nullable: false,
        oldClrType: typeof(DateTimeOffset),
        oldType: "timestamp with time zone",
        oldNullable: true);

      migrationBuilder.AddColumn<string>(
        name: "Region",
        schema: "Entity",
        table: "User",
        type: "varchar(255)",
        nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "City",
        schema: "Entity",
        table: "User",
        type: "varchar(255)",
        nullable: true);

      migrationBuilder.AddColumn<NetTopologySuite.Geometries.Point>(
        name: "Coordinates",
        schema: "Entity",
        table: "User",
        type: "geography (point, 4326)",
        nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "LocationSource",
        schema: "Entity",
        table: "User",
        type: "varchar(25)",
        nullable: true);

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
          table.ForeignKey(
            name: "FK_UserPreferences_User_UserId",
            column: x => x.UserId,
            principalSchema: "Entity",
            principalTable: "User",
            principalColumn: "Id");
          table.ForeignKey(
            name: "FK_UserPreferences_UserGoal_GoalId",
            column: x => x.GoalId,
            principalSchema: "Entity",
            principalTable: "UserGoal",
            principalColumn: "Id");
          table.ForeignKey(
            name: "FK_UserPreferences_TimeInterval_CommitmentIntervalId",
            column: x => x.CommitmentIntervalId,
            principalSchema: "Lookup",
            principalTable: "TimeInterval",
            principalColumn: "Id");
          table.ForeignKey(
            name: "FK_UserPreferences_EngagementType_EngagementTypeId",
            column: x => x.EngagementTypeId,
            principalSchema: "Lookup",
            principalTable: "EngagementType",
            principalColumn: "Id");
        });

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferences_GoalId",
        schema: "Entity",
        table: "UserPreferences",
        column: "GoalId");

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferences_CommitmentIntervalId",
        schema: "Entity",
        table: "UserPreferences",
        column: "CommitmentIntervalId");

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferences_EngagementTypeId",
        schema: "Entity",
        table: "UserPreferences",
        column: "EngagementTypeId");

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
          table.ForeignKey(
            name: "FK_UserPreferenceCategories_OpportunityCategory_CategoryId",
            column: x => x.CategoryId,
            principalSchema: "Opportunity",
            principalTable: "OpportunityCategory",
            principalColumn: "Id");
          table.ForeignKey(
            name: "FK_UserPreferenceCategories_UserPreferences_UserId",
            column: x => x.UserId,
            principalSchema: "Entity",
            principalTable: "UserPreferences",
            principalColumn: "UserId");
        });

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceCategories_CategoryId",
        schema: "Entity",
        table: "UserPreferenceCategories",
        column: "CategoryId");

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceCategories_UserId_CategoryId",
        schema: "Entity",
        table: "UserPreferenceCategories",
        columns: ["UserId", "CategoryId"],
        unique: true);

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
          table.ForeignKey(
            name: "FK_UserPreferenceLanguages_UserPreferences_UserId",
            column: x => x.UserId,
            principalSchema: "Entity",
            principalTable: "UserPreferences",
            principalColumn: "UserId");
          table.ForeignKey(
            name: "FK_UserPreferenceLanguages_Language_LanguageId",
            column: x => x.LanguageId,
            principalSchema: "Lookup",
            principalTable: "Language",
            principalColumn: "Id");
        });

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceLanguages_LanguageId",
        schema: "Entity",
        table: "UserPreferenceLanguages",
        column: "LanguageId");

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceLanguages_UserId_LanguageId",
        schema: "Entity",
        table: "UserPreferenceLanguages",
        columns: ["UserId", "LanguageId"],
        unique: true);

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
      migrationBuilder.AddColumn<string>(
          name: "AccessibilitySupport",
          schema: "Opportunity",
          table: "Opportunity",
          type: "varchar(30)",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "AccommodationOtherDescription",
          schema: "Opportunity",
          table: "Opportunity",
          type: "varchar(500)",
          nullable: true);

      migrationBuilder.AddColumn<short>(
          name: "AgeFrom",
          schema: "Opportunity",
          table: "Opportunity",
          type: "smallint",
          nullable: true);

      migrationBuilder.AddColumn<short>(
          name: "AgeTo",
          schema: "Opportunity",
          table: "Opportunity",
          type: "smallint",
          nullable: true);

      migrationBuilder.AddColumn<bool>(
          name: "Incentivized",
          schema: "Opportunity",
          table: "Opportunity",
          type: "boolean",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "PartnerIncentiveAmount",
          schema: "Opportunity",
          table: "Opportunity",
          type: "numeric(18,4)",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "PartnerIncentiveCurrency",
          schema: "Opportunity",
          table: "Opportunity",
          type: "varchar(3)",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "Provider",
          schema: "Opportunity",
          table: "Opportunity",
          type: "varchar(255)",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "RewardType",
          schema: "Opportunity",
          table: "Opportunity",
          type: "varchar(30)",
          nullable: false,
          defaultValue: "None");

      migrationBuilder.CreateTable(
          name: "Currency",
          schema: "Lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Code = table.Column<string>(type: "varchar(3)", nullable: false),
            Name = table.Column<string>(type: "varchar(125)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Currency", x => x.Id);
            table.UniqueConstraint("AK_Currency_Code", x => x.Code);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityAccommodations",
          schema: "Opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uuid", nullable: false),
            AccommodationId = table.Column<Guid>(type: "uuid", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityAccommodations", x => x.Id);
            table.ForeignKey(
                name: "FK_OpportunityAccommodations_Accessibility_AccommodationId",
                column: x => x.AccommodationId,
                principalSchema: "Lookup",
                principalTable: "Accessibility",
                principalColumn: "Id");
            table.ForeignKey(
                name: "FK_OpportunityAccommodations_Opportunity_OpportunityId",
                column: x => x.OpportunityId,
                principalSchema: "Opportunity",
                principalTable: "Opportunity",
                principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "SustainableDevelopmentGoal",
          schema: "Lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Number = table.Column<short>(type: "smallint", nullable: false),
            Name = table.Column<string>(type: "varchar(125)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_SustainableDevelopmentGoal", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "TargetedGroup",
          schema: "Lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(125)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_TargetedGroup", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "OpportunitySustainableDevelopmentGoals",
          schema: "Opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uuid", nullable: false),
            SustainableDevelopmentGoalId = table.Column<Guid>(type: "uuid", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunitySustainableDevelopmentGoals", x => x.Id);
            table.ForeignKey(
                name: "FK_OpportunitySustainableDevelopmentGoals_Opportunity_Opportun~",
                column: x => x.OpportunityId,
                principalSchema: "Opportunity",
                principalTable: "Opportunity",
                principalColumn: "Id");
            table.ForeignKey(
                name: "FK_OpportunitySustainableDevelopmentGoals_SustainableDevelopme~",
                column: x => x.SustainableDevelopmentGoalId,
                principalSchema: "Lookup",
                principalTable: "SustainableDevelopmentGoal",
                principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "OpportunityTargetedGroups",
          schema: "Opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uuid", nullable: false),
            TargetedGroupId = table.Column<Guid>(type: "uuid", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityTargetedGroups", x => x.Id);
            table.ForeignKey(
                name: "FK_OpportunityTargetedGroups_Opportunity_OpportunityId",
                column: x => x.OpportunityId,
                principalSchema: "Opportunity",
                principalTable: "Opportunity",
                principalColumn: "Id");
            table.ForeignKey(
                name: "FK_OpportunityTargetedGroups_TargetedGroup_TargetedGroupId",
                column: x => x.TargetedGroupId,
                principalSchema: "Lookup",
                principalTable: "TargetedGroup",
                principalColumn: "Id");
          });

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_PartnerIncentiveCurrency",
          schema: "Opportunity",
          table: "Opportunity",
          column: "PartnerIncentiveCurrency");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_AccommodationOtherDescription",
          schema: "Opportunity",
          table: "Opportunity",
          column: "AccommodationOtherDescription")
          .Annotation("Npgsql:IndexMethod", "gin")
          .Annotation("Npgsql:IndexOperators", TrigramIndexOperators);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_Provider",
          schema: "Opportunity",
          table: "Opportunity",
          column: "Provider")
          .Annotation("Npgsql:IndexMethod", "gin")
          .Annotation("Npgsql:IndexOperators", TrigramIndexOperators);

      migrationBuilder.CreateIndex(
          name: "IX_Currency_Name",
          schema: "Lookup",
          table: "Currency",
          column: "Name");

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityAccommodations_AccommodationId",
          schema: "Opportunity",
          table: "OpportunityAccommodations",
          column: "AccommodationId");

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityAccommodations_OpportunityId_AccommodationId",
          schema: "Opportunity",
          table: "OpportunityAccommodations",
          columns: AccommodationIndexColumns,
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunitySustainableDevelopmentGoals_OpportunityId_Sustai~",
          schema: "Opportunity",
          table: "OpportunitySustainableDevelopmentGoals",
          columns: SustainableDevelopmentGoalIndexColumns,
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunitySustainableDevelopmentGoals_SustainableDevelopme~",
          schema: "Opportunity",
          table: "OpportunitySustainableDevelopmentGoals",
          column: "SustainableDevelopmentGoalId");

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityTargetedGroups_OpportunityId_TargetedGroupId",
          schema: "Opportunity",
          table: "OpportunityTargetedGroups",
          columns: TargetedGroupIndexColumns,
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityTargetedGroups_TargetedGroupId",
          schema: "Opportunity",
          table: "OpportunityTargetedGroups",
          column: "TargetedGroupId");

      migrationBuilder.CreateIndex(
          name: "IX_SustainableDevelopmentGoal_Name",
          schema: "Lookup",
          table: "SustainableDevelopmentGoal",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_SustainableDevelopmentGoal_Number",
          schema: "Lookup",
          table: "SustainableDevelopmentGoal",
          column: "Number",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_TargetedGroup_Name",
          schema: "Lookup",
          table: "TargetedGroup",
          column: "Name",
          unique: true);

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_Currency_PartnerIncentiveCurrency",
          schema: "Opportunity",
          table: "Opportunity",
          column: "PartnerIncentiveCurrency",
          principalSchema: "Lookup",
          principalTable: "Currency",
          principalColumn: "Code");

      ApplicationDb_CF_Configuration_Seeding_CoreOpportunityLookups.Seed(migrationBuilder);

      // Seed currency codes before validating existing payout rows. Preserve stored values;
      // the foreign key rejects unknown codes without rewriting historical transactions.
      migrationBuilder.AlterColumn<string>(
          name: "Currency",
          schema: "Payout",
          table: "Transaction",
          type: "varchar(3)",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(10)");

      migrationBuilder.CreateIndex(
          name: "IX_Payout_Transaction_Currency",
          schema: "Payout",
          table: "Transaction",
          column: "Currency");

      migrationBuilder.AddForeignKey(
          name: "FK_Transaction_Currency_Currency",
          schema: "Payout",
          table: "Transaction",
          column: "Currency",
          principalSchema: "Lookup",
          principalTable: "Currency",
          principalColumn: "Code",
          onDelete: ReferentialAction.NoAction);

      // Preserve historical allocations; a Job with configured ZLTO rewards needs explicit resolution.
      migrationBuilder.Sql("""
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM "Opportunity"."Opportunity" o
            JOIN "Opportunity"."OpportunityType" t ON t."Id" = o."TypeId"
            WHERE t."Name" = 'Job' AND (o."ZltoReward" IS NOT NULL OR o."ZltoRewardPool" IS NOT NULL)) THEN
            RAISE EXCEPTION 'Jobs with configured ZLTO rewards must be resolved before applying CF configuration';
          END IF;
        END $$;
        UPDATE "Opportunity"."Opportunity"
        SET "RewardType" = CASE WHEN "ZltoReward" IS NOT NULL THEN 'ZLTO' ELSE 'None' END;
        """);

      #region Custom Fields
      #region Difficulty
      ApplicationDb_CF_Configuration_Seeding_Difficulty.Seed(migrationBuilder);

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_OpportunityDifficulty_DifficultyId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropTable(
          name: "OpportunityDifficulty",
          schema: "Opportunity");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_DifficultyId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "DifficultyId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_CommitmentInte~",
          schema: "Opportunity",
          table: "Opportunity",
          columns: OpportunitySearchIndexColumns);
      #endregion

      #region Job
      ApplicationDb_CF_Configuration_Seeding_Jobs.Seed(migrationBuilder);
      #endregion

      #region Impact Action
      ApplicationDb_CF_Configuration_Seeding_ImpactAction.Seed(migrationBuilder);
      #endregion
      #endregion
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      // This configuration migration includes data changes that cannot be reversed losslessly.
      throw new NotSupportedException("The CF configuration migration cannot be reversed safely; restore a pre-migration backup or apply a reviewed forward migration.");
    }
  }
}
