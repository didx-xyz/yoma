using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Custom_Fields : Migration
  {
    private static readonly string[] Annotation_Includes_OpportunityId_MyOpportunityId =
      ["OpportunityId", "MyOpportunityId"];

    private static readonly string[] Annotation_Operators_GinTrgm =
      ["gin_trgm_ops"];

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Block_BlockReason_ReasonId",
          schema: "Referral",
          table: "Block");

      migrationBuilder.DropForeignKey(
          name: "FK_CredentialIssuance_CredentialIssuanceStatus_StatusId",
          schema: "SSI",
          table: "CredentialIssuance");

      migrationBuilder.DropForeignKey(
          name: "FK_CredentialIssuance_SchemaType_SchemaTypeId",
          schema: "SSI",
          table: "CredentialIssuance");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_Status_StatusId",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_LinkStatus_StatusId",
          schema: "Referral",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_Program_ProgramId",
          schema: "Referral",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_User_UserId",
          schema: "Referral",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_LinkUsageStatus_StatusId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_Link_LinkId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_Program_ProgramId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_User_UserId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunity_MyOpportunityAction_ActionId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunity_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunity_User_UserId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunityVerifications_MyOpportunity_MyOpportunityId",
          schema: "Opportunity",
          table: "MyOpportunityVerifications");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunityVerifications_OpportunityVerificationType_Veri~",
          schema: "Opportunity",
          table: "MyOpportunityVerifications");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_OpportunityStatus_StatusId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_OpportunityType_TypeId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_Organization_OrganizationId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCategories_OpportunityCategory_CategoryId",
          schema: "Opportunity",
          table: "OpportunityCategories");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCategories_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCategories");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCountries_Country_CountryId",
          schema: "Opportunity",
          table: "OpportunityCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCountries_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityLanguages_Language_LanguageId",
          schema: "Opportunity",
          table: "OpportunityLanguages");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityLanguages_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityLanguages");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunitySkills_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunitySkills");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunitySkills_Skill_SkillId",
          schema: "Opportunity",
          table: "OpportunitySkills");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityVerificationTypes_OpportunityVerificationType_Ve~",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityVerificationTypes_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_Organization_OrganizationStatus_StatusId",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationDocuments_Blob_FileId",
          schema: "Entity",
          table: "OrganizationDocuments");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationDocuments_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationDocuments");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationProviderTypes_OrganizationProviderType_Provider~",
          schema: "Entity",
          table: "OrganizationProviderTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationProviderTypes_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationProviderTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationUsers_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationUsers");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationUsers_User_UserId",
          schema: "Entity",
          table: "OrganizationUsers");

      migrationBuilder.DropForeignKey(
          name: "FK_ProcessingLog_Partner_PartnerId",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropForeignKey(
          name: "FK_ProcessingLog_ProcessingStatus_StatusId",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropForeignKey(
          name: "FK_Program_ProgramStatus_StatusId",
          schema: "Referral",
          table: "Program");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramCountries_Country_CountryId",
          schema: "Referral",
          table: "ProgramCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramCountries_Program_ProgramId",
          schema: "Referral",
          table: "ProgramCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramPathway_Program_ProgramId",
          schema: "Referral",
          table: "ProgramPathway");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramPathwayStep_ProgramPathway_PathwayId",
          schema: "Referral",
          table: "ProgramPathwayStep");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramPathwayTask_ProgramPathwayStep_StepId",
          schema: "Referral",
          table: "ProgramPathwayTask");

      migrationBuilder.DropForeignKey(
          name: "FK_Schedule_ScheduleStatus_StatusId",
          schema: "Download",
          table: "Schedule");

      migrationBuilder.DropForeignKey(
          name: "FK_Schedule_User_UserId",
          schema: "Download",
          table: "Schedule");

      migrationBuilder.DropForeignKey(
          name: "FK_SchemaEntityProperty_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityProperty");

      migrationBuilder.DropForeignKey(
          name: "FK_SchemaEntityType_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityType");

      migrationBuilder.DropForeignKey(
          name: "FK_SchemaEntityType_SchemaType_SSISchemaTypeId",
          schema: "SSI",
          table: "SchemaEntityType");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRule_Country_StoreCountryId",
          schema: "Marketplace",
          table: "StoreAccessControlRule");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRule_Organization_OrganizationId",
          schema: "Marketplace",
          table: "StoreAccessControlRule");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRule_StoreAccessControlRuleStatus_StatusId",
          schema: "Marketplace",
          table: "StoreAccessControlRule");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_Opportunity_OpportunityId",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_StoreAccessControlRule_St~",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_TenantCreation_TenantCreationStatus_StatusId",
          schema: "SSI",
          table: "TenantCreation");

      migrationBuilder.DropForeignKey(
          name: "FK_Tracking_Partner_PartnerId",
          schema: "PartnerSync",
          table: "Tracking");

      migrationBuilder.DropForeignKey(
          name: "FK_Transaction_TransactionStatus_StatusId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropForeignKey(
          name: "FK_Transaction_User_UserId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropForeignKey(
          name: "FK_TransactionLog_TransactionStatus_StatusId",
          schema: "Marketplace",
          table: "TransactionLog");

      migrationBuilder.DropForeignKey(
          name: "FK_TransactionLog_User_UserId",
          schema: "Marketplace",
          table: "TransactionLog");

      migrationBuilder.DropForeignKey(
          name: "FK_UsageLog_Link_LinkId",
          schema: "ActionLink",
          table: "UsageLog");

      migrationBuilder.DropForeignKey(
          name: "FK_UsageLog_User_UserId",
          schema: "ActionLink",
          table: "UsageLog");

      migrationBuilder.DropForeignKey(
          name: "FK_UserLoginHistory_User_UserId",
          schema: "Entity",
          table: "UserLoginHistory");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkillOrganizations_Organization_OrganizationId",
          schema: "Entity",
          table: "UserSkillOrganizations");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkillOrganizations_UserSkills_UserSkillId",
          schema: "Entity",
          table: "UserSkillOrganizations");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkills_Skill_SkillId",
          schema: "Entity",
          table: "UserSkills");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkills_User_UserId",
          schema: "Entity",
          table: "UserSkills");

      migrationBuilder.DropForeignKey(
          name: "FK_WalletCreation_User_UserId",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropForeignKey(
          name: "FK_WalletCreation_WalletCreationStatus_StatusId",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.EnsureSchema(
          name: "Core");

      migrationBuilder.AlterDatabase()
          .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

      migrationBuilder.CreateTable(
          name: "CustomFieldDefinition",
          schema: "Core",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            EntityType = table.Column<string>(type: "varchar(50)", nullable: false),
            EntityContext = table.Column<string>(type: "varchar(100)", nullable: true),
            Key = table.Column<string>(type: "varchar(100)", nullable: false),
            Title = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: true),
            Group = table.Column<string>(type: "varchar(100)", nullable: false),
            SubGroup = table.Column<string>(type: "varchar(100)", nullable: true),
            DataType = table.Column<string>(type: "varchar(50)", nullable: false),
            LookupType = table.Column<string>(type: "varchar(50)", nullable: true),
            ValidationRegex = table.Column<string>(type: "varchar(500)", nullable: true),
            ValidationErrorMessage = table.Column<string>(type: "varchar(500)", nullable: true),
            IsRequired = table.Column<bool>(type: "boolean", nullable: false),
            SupportsMultiple = table.Column<bool>(type: "boolean", nullable: true),
            SortOrder = table.Column<int>(type: "integer", nullable: false),
            IsActive = table.Column<bool>(type: "boolean", nullable: false),
            IsSystem = table.Column<bool>(type: "boolean", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_CustomFieldDefinition", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "CustomFieldOption",
          schema: "Core",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            CustomFieldDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
            Key = table.Column<string>(type: "varchar(100)", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            SortOrder = table.Column<int>(type: "integer", nullable: false),
            IsActive = table.Column<bool>(type: "boolean", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_CustomFieldOption", x => x.Id);
            table.ForeignKey(
                      name: "FK_CustomFieldOption_CustomFieldDefinition_CustomFieldDefiniti~",
                      column: x => x.CustomFieldDefinitionId,
                      principalSchema: "Core",
                      principalTable: "CustomFieldDefinition",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "CustomFieldValue",
          schema: "Core",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            CustomFieldDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uuid", nullable: true),
            MyOpportunityId = table.Column<Guid>(type: "uuid", nullable: true),
            Value = table.Column<string>(type: "text", nullable: false),
            ValueNumeric = table.Column<decimal>(type: "numeric", nullable: true),
            ValueDateTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_CustomFieldValue", x => x.Id);
            table.CheckConstraint("CK_CustomFieldValue_Entity", "(\"OpportunityId\" IS NOT NULL AND \"MyOpportunityId\" IS NULL) OR (\"OpportunityId\" IS NULL AND \"MyOpportunityId\" IS NOT NULL)");
            table.ForeignKey(
                      name: "FK_CustomFieldValue_CustomFieldDefinition_CustomFieldDefinitio~",
                      column: x => x.CustomFieldDefinitionId,
                      principalSchema: "Core",
                      principalTable: "CustomFieldDefinition",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_CustomFieldValue_MyOpportunity_MyOpportunityId",
                      column: x => x.MyOpportunityId,
                      principalSchema: "Opportunity",
                      principalTable: "MyOpportunity",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_CustomFieldValue_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "Opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition",
          columns: ["EntityType", "EntityContext", "DataType", "IsRequired", "IsSystem"]);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_IsActive_Gro~",
          schema: "Core",
          table: "CustomFieldDefinition",
          columns: ["EntityType", "EntityContext", "IsActive", "Group", "SubGroup", "SortOrder"]);

      migrationBuilder.CreateIndex(
          name: "UX_CustomFieldDefinition_EntityType_Key",
          schema: "Core",
          table: "CustomFieldDefinition",
          columns: ["EntityType", "Key"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldOption_CustomFieldDefinitionId_IsActive_SortOrder",
          schema: "Core",
          table: "CustomFieldOption",
          columns: ["CustomFieldDefinitionId", "IsActive", "SortOrder"]);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldOption_CustomFieldDefinitionId_Key",
          schema: "Core",
          table: "CustomFieldOption",
          columns: ["CustomFieldDefinitionId", "Key"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldValue_Definition",
          schema: "Core",
          table: "CustomFieldValue",
          column: "CustomFieldDefinitionId")
          .Annotation("Npgsql:IndexInclude", Annotation_Includes_OpportunityId_MyOpportunityId);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldValue_Definition_ValueDateTime",
          schema: "Core",
          table: "CustomFieldValue",
          columns: ["CustomFieldDefinitionId", "ValueDateTime"],
          filter: "\"ValueDateTime\" IS NOT NULL")
          .Annotation("Npgsql:IndexInclude", Annotation_Includes_OpportunityId_MyOpportunityId);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldValue_Definition_ValueNumeric",
          schema: "Core",
          table: "CustomFieldValue",
          columns: ["CustomFieldDefinitionId", "ValueNumeric"],
          filter: "\"ValueNumeric\" IS NOT NULL")
          .Annotation("Npgsql:IndexInclude", Annotation_Includes_OpportunityId_MyOpportunityId);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldValue_MyOpportunityId_CustomFieldDefinitionId",
          schema: "Core",
          table: "CustomFieldValue",
          columns: ["MyOpportunityId", "CustomFieldDefinitionId"],
          unique: true,
          filter: "\"MyOpportunityId\" IS NOT NULL");

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldValue_OpportunityId_CustomFieldDefinitionId",
          schema: "Core",
          table: "CustomFieldValue",
          columns: ["OpportunityId", "CustomFieldDefinitionId"],
          unique: true,
          filter: "\"OpportunityId\" IS NOT NULL");

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldValue_Value_GIN_Trgm",
          schema: "Core",
          table: "CustomFieldValue",
          column: "Value")
          .Annotation("Npgsql:IndexMethod", "GIN")
          .Annotation("Npgsql:IndexOperators", Annotation_Operators_GinTrgm);

      migrationBuilder.AddForeignKey(
          name: "FK_Block_BlockReason_ReasonId",
          schema: "Referral",
          table: "Block",
          column: "ReasonId",
          principalSchema: "Referral",
          principalTable: "BlockReason",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_CredentialIssuance_CredentialIssuanceStatus_StatusId",
          schema: "SSI",
          table: "CredentialIssuance",
          column: "StatusId",
          principalSchema: "SSI",
          principalTable: "CredentialIssuanceStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_CredentialIssuance_SchemaType_SchemaTypeId",
          schema: "SSI",
          table: "CredentialIssuance",
          column: "SchemaTypeId",
          principalSchema: "SSI",
          principalTable: "SchemaType",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Link_Status_StatusId",
          schema: "ActionLink",
          table: "Link",
          column: "StatusId",
          principalSchema: "ActionLink",
          principalTable: "Status",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Link_LinkStatus_StatusId",
          schema: "Referral",
          table: "Link",
          column: "StatusId",
          principalSchema: "Referral",
          principalTable: "LinkStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Link_Program_ProgramId",
          schema: "Referral",
          table: "Link",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Link_User_UserId",
          schema: "Referral",
          table: "Link",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_LinkUsageStatus_StatusId",
          schema: "Referral",
          table: "LinkUsage",
          column: "StatusId",
          principalSchema: "Referral",
          principalTable: "LinkUsageStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_Link_LinkId",
          schema: "Referral",
          table: "LinkUsage",
          column: "LinkId",
          principalSchema: "Referral",
          principalTable: "Link",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_Program_ProgramId",
          schema: "Referral",
          table: "LinkUsage",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_User_UserId",
          schema: "Referral",
          table: "LinkUsage",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunity_MyOpportunityAction_ActionId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "ActionId",
          principalSchema: "Opportunity",
          principalTable: "MyOpportunityAction",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunity_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunity_User_UserId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunityVerifications_MyOpportunity_MyOpportunityId",
          schema: "Opportunity",
          table: "MyOpportunityVerifications",
          column: "MyOpportunityId",
          principalSchema: "Opportunity",
          principalTable: "MyOpportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunityVerifications_OpportunityVerificationType_Veri~",
          schema: "Opportunity",
          table: "MyOpportunityVerifications",
          column: "VerificationTypeId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityVerificationType",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_OpportunityStatus_StatusId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "StatusId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_OpportunityType_TypeId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "TypeId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityType",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_Organization_OrganizationId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCategories_OpportunityCategory_CategoryId",
          schema: "Opportunity",
          table: "OpportunityCategories",
          column: "CategoryId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityCategory",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCategories_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCategories",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCountries_Country_CountryId",
          schema: "Opportunity",
          table: "OpportunityCountries",
          column: "CountryId",
          principalSchema: "Lookup",
          principalTable: "Country",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCountries_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCountries",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityLanguages_Language_LanguageId",
          schema: "Opportunity",
          table: "OpportunityLanguages",
          column: "LanguageId",
          principalSchema: "Lookup",
          principalTable: "Language",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityLanguages_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityLanguages",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunitySkills_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunitySkills",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunitySkills_Skill_SkillId",
          schema: "Opportunity",
          table: "OpportunitySkills",
          column: "SkillId",
          principalSchema: "Lookup",
          principalTable: "Skill",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityVerificationTypes_OpportunityVerificationType_Ve~",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes",
          column: "VerificationTypeId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityVerificationType",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityVerificationTypes_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Organization_OrganizationStatus_StatusId",
          schema: "Entity",
          table: "Organization",
          column: "StatusId",
          principalSchema: "Entity",
          principalTable: "OrganizationStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationDocuments_Blob_FileId",
          schema: "Entity",
          table: "OrganizationDocuments",
          column: "FileId",
          principalSchema: "Object",
          principalTable: "Blob",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationDocuments_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationDocuments",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationProviderTypes_OrganizationProviderType_Provider~",
          schema: "Entity",
          table: "OrganizationProviderTypes",
          column: "ProviderTypeId",
          principalSchema: "Entity",
          principalTable: "OrganizationProviderType",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationProviderTypes_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationProviderTypes",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationUsers_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationUsers",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationUsers_User_UserId",
          schema: "Entity",
          table: "OrganizationUsers",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProcessingLog_Partner_PartnerId",
          schema: "PartnerSync",
          table: "ProcessingLog",
          column: "PartnerId",
          principalSchema: "PartnerSync",
          principalTable: "Partner",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProcessingLog_ProcessingStatus_StatusId",
          schema: "PartnerSync",
          table: "ProcessingLog",
          column: "StatusId",
          principalSchema: "PartnerSync",
          principalTable: "ProcessingStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Program_ProgramStatus_StatusId",
          schema: "Referral",
          table: "Program",
          column: "StatusId",
          principalSchema: "Referral",
          principalTable: "ProgramStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramCountries_Country_CountryId",
          schema: "Referral",
          table: "ProgramCountries",
          column: "CountryId",
          principalSchema: "Lookup",
          principalTable: "Country",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramCountries_Program_ProgramId",
          schema: "Referral",
          table: "ProgramCountries",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramPathway_Program_ProgramId",
          schema: "Referral",
          table: "ProgramPathway",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramPathwayStep_ProgramPathway_PathwayId",
          schema: "Referral",
          table: "ProgramPathwayStep",
          column: "PathwayId",
          principalSchema: "Referral",
          principalTable: "ProgramPathway",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramPathwayTask_ProgramPathwayStep_StepId",
          schema: "Referral",
          table: "ProgramPathwayTask",
          column: "StepId",
          principalSchema: "Referral",
          principalTable: "ProgramPathwayStep",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Schedule_ScheduleStatus_StatusId",
          schema: "Download",
          table: "Schedule",
          column: "StatusId",
          principalSchema: "Download",
          principalTable: "ScheduleStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Schedule_User_UserId",
          schema: "Download",
          table: "Schedule",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_SchemaEntityProperty_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityProperty",
          column: "SSISchemaEntityId",
          principalSchema: "SSI",
          principalTable: "SchemaEntity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_SchemaEntityType_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityType",
          column: "SSISchemaEntityId",
          principalSchema: "SSI",
          principalTable: "SchemaEntity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_SchemaEntityType_SchemaType_SSISchemaTypeId",
          schema: "SSI",
          table: "SchemaEntityType",
          column: "SSISchemaTypeId",
          principalSchema: "SSI",
          principalTable: "SchemaType",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRule_Country_StoreCountryId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "StoreCountryId",
          principalSchema: "Lookup",
          principalTable: "Country",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRule_Organization_OrganizationId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRule_StoreAccessControlRuleStatus_StatusId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "StatusId",
          principalSchema: "Marketplace",
          principalTable: "StoreAccessControlRuleStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_Opportunity_OpportunityId",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_StoreAccessControlRule_St~",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity",
          column: "StoreAccessControlRuleId",
          principalSchema: "Marketplace",
          principalTable: "StoreAccessControlRule",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_TenantCreation_TenantCreationStatus_StatusId",
          schema: "SSI",
          table: "TenantCreation",
          column: "StatusId",
          principalSchema: "SSI",
          principalTable: "TenantCreationStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Tracking_Partner_PartnerId",
          schema: "PartnerSync",
          table: "Tracking",
          column: "PartnerId",
          principalSchema: "PartnerSync",
          principalTable: "Partner",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Transaction_TransactionStatus_StatusId",
          schema: "Reward",
          table: "Transaction",
          column: "StatusId",
          principalSchema: "Reward",
          principalTable: "TransactionStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Transaction_User_UserId",
          schema: "Reward",
          table: "Transaction",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_TransactionLog_TransactionStatus_StatusId",
          schema: "Marketplace",
          table: "TransactionLog",
          column: "StatusId",
          principalSchema: "Marketplace",
          principalTable: "TransactionStatus",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_TransactionLog_User_UserId",
          schema: "Marketplace",
          table: "TransactionLog",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_UsageLog_Link_LinkId",
          schema: "ActionLink",
          table: "UsageLog",
          column: "LinkId",
          principalSchema: "ActionLink",
          principalTable: "Link",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_UsageLog_User_UserId",
          schema: "ActionLink",
          table: "UsageLog",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_UserLoginHistory_User_UserId",
          schema: "Entity",
          table: "UserLoginHistory",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkillOrganizations_Organization_OrganizationId",
          schema: "Entity",
          table: "UserSkillOrganizations",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkillOrganizations_UserSkills_UserSkillId",
          schema: "Entity",
          table: "UserSkillOrganizations",
          column: "UserSkillId",
          principalSchema: "Entity",
          principalTable: "UserSkills",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkills_Skill_SkillId",
          schema: "Entity",
          table: "UserSkills",
          column: "SkillId",
          principalSchema: "Lookup",
          principalTable: "Skill",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkills_User_UserId",
          schema: "Entity",
          table: "UserSkills",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_WalletCreation_User_UserId",
          schema: "Reward",
          table: "WalletCreation",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_WalletCreation_WalletCreationStatus_StatusId",
          schema: "Reward",
          table: "WalletCreation",
          column: "StatusId",
          principalSchema: "Reward",
          principalTable: "WalletCreationStatus",
          principalColumn: "Id");

      ApplicationDb_Custom_Fields_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Block_BlockReason_ReasonId",
          schema: "Referral",
          table: "Block");

      migrationBuilder.DropForeignKey(
          name: "FK_CredentialIssuance_CredentialIssuanceStatus_StatusId",
          schema: "SSI",
          table: "CredentialIssuance");

      migrationBuilder.DropForeignKey(
          name: "FK_CredentialIssuance_SchemaType_SchemaTypeId",
          schema: "SSI",
          table: "CredentialIssuance");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_Status_StatusId",
          schema: "ActionLink",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_LinkStatus_StatusId",
          schema: "Referral",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_Program_ProgramId",
          schema: "Referral",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_Link_User_UserId",
          schema: "Referral",
          table: "Link");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_LinkUsageStatus_StatusId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_Link_LinkId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_Program_ProgramId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_LinkUsage_User_UserId",
          schema: "Referral",
          table: "LinkUsage");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunity_MyOpportunityAction_ActionId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunity_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunity_User_UserId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunityVerifications_MyOpportunity_MyOpportunityId",
          schema: "Opportunity",
          table: "MyOpportunityVerifications");

      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunityVerifications_OpportunityVerificationType_Veri~",
          schema: "Opportunity",
          table: "MyOpportunityVerifications");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_OpportunityStatus_StatusId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_OpportunityType_TypeId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_Organization_OrganizationId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCategories_OpportunityCategory_CategoryId",
          schema: "Opportunity",
          table: "OpportunityCategories");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCategories_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCategories");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCountries_Country_CountryId",
          schema: "Opportunity",
          table: "OpportunityCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityCountries_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityLanguages_Language_LanguageId",
          schema: "Opportunity",
          table: "OpportunityLanguages");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityLanguages_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityLanguages");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunitySkills_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunitySkills");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunitySkills_Skill_SkillId",
          schema: "Opportunity",
          table: "OpportunitySkills");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityVerificationTypes_OpportunityVerificationType_Ve~",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_OpportunityVerificationTypes_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_Organization_OrganizationStatus_StatusId",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationDocuments_Blob_FileId",
          schema: "Entity",
          table: "OrganizationDocuments");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationDocuments_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationDocuments");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationProviderTypes_OrganizationProviderType_Provider~",
          schema: "Entity",
          table: "OrganizationProviderTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationProviderTypes_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationProviderTypes");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationUsers_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationUsers");

      migrationBuilder.DropForeignKey(
          name: "FK_OrganizationUsers_User_UserId",
          schema: "Entity",
          table: "OrganizationUsers");

      migrationBuilder.DropForeignKey(
          name: "FK_ProcessingLog_Partner_PartnerId",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropForeignKey(
          name: "FK_ProcessingLog_ProcessingStatus_StatusId",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropForeignKey(
          name: "FK_Program_ProgramStatus_StatusId",
          schema: "Referral",
          table: "Program");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramCountries_Country_CountryId",
          schema: "Referral",
          table: "ProgramCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramCountries_Program_ProgramId",
          schema: "Referral",
          table: "ProgramCountries");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramPathway_Program_ProgramId",
          schema: "Referral",
          table: "ProgramPathway");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramPathwayStep_ProgramPathway_PathwayId",
          schema: "Referral",
          table: "ProgramPathwayStep");

      migrationBuilder.DropForeignKey(
          name: "FK_ProgramPathwayTask_ProgramPathwayStep_StepId",
          schema: "Referral",
          table: "ProgramPathwayTask");

      migrationBuilder.DropForeignKey(
          name: "FK_Schedule_ScheduleStatus_StatusId",
          schema: "Download",
          table: "Schedule");

      migrationBuilder.DropForeignKey(
          name: "FK_Schedule_User_UserId",
          schema: "Download",
          table: "Schedule");

      migrationBuilder.DropForeignKey(
          name: "FK_SchemaEntityProperty_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityProperty");

      migrationBuilder.DropForeignKey(
          name: "FK_SchemaEntityType_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityType");

      migrationBuilder.DropForeignKey(
          name: "FK_SchemaEntityType_SchemaType_SSISchemaTypeId",
          schema: "SSI",
          table: "SchemaEntityType");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRule_Country_StoreCountryId",
          schema: "Marketplace",
          table: "StoreAccessControlRule");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRule_Organization_OrganizationId",
          schema: "Marketplace",
          table: "StoreAccessControlRule");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRule_StoreAccessControlRuleStatus_StatusId",
          schema: "Marketplace",
          table: "StoreAccessControlRule");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_Opportunity_OpportunityId",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_StoreAccessControlRule_St~",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_TenantCreation_TenantCreationStatus_StatusId",
          schema: "SSI",
          table: "TenantCreation");

      migrationBuilder.DropForeignKey(
          name: "FK_Tracking_Partner_PartnerId",
          schema: "PartnerSync",
          table: "Tracking");

      migrationBuilder.DropForeignKey(
          name: "FK_Transaction_TransactionStatus_StatusId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropForeignKey(
          name: "FK_Transaction_User_UserId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropForeignKey(
          name: "FK_TransactionLog_TransactionStatus_StatusId",
          schema: "Marketplace",
          table: "TransactionLog");

      migrationBuilder.DropForeignKey(
          name: "FK_TransactionLog_User_UserId",
          schema: "Marketplace",
          table: "TransactionLog");

      migrationBuilder.DropForeignKey(
          name: "FK_UsageLog_Link_LinkId",
          schema: "ActionLink",
          table: "UsageLog");

      migrationBuilder.DropForeignKey(
          name: "FK_UsageLog_User_UserId",
          schema: "ActionLink",
          table: "UsageLog");

      migrationBuilder.DropForeignKey(
          name: "FK_UserLoginHistory_User_UserId",
          schema: "Entity",
          table: "UserLoginHistory");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkillOrganizations_Organization_OrganizationId",
          schema: "Entity",
          table: "UserSkillOrganizations");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkillOrganizations_UserSkills_UserSkillId",
          schema: "Entity",
          table: "UserSkillOrganizations");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkills_Skill_SkillId",
          schema: "Entity",
          table: "UserSkills");

      migrationBuilder.DropForeignKey(
          name: "FK_UserSkills_User_UserId",
          schema: "Entity",
          table: "UserSkills");

      migrationBuilder.DropForeignKey(
          name: "FK_WalletCreation_User_UserId",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropForeignKey(
          name: "FK_WalletCreation_WalletCreationStatus_StatusId",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropTable(
          name: "CustomFieldOption",
          schema: "Core");

      migrationBuilder.DropTable(
          name: "CustomFieldValue",
          schema: "Core");

      migrationBuilder.DropTable(
          name: "CustomFieldDefinition",
          schema: "Core");

      migrationBuilder.AlterDatabase()
          .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,");

      migrationBuilder.AddForeignKey(
          name: "FK_Block_BlockReason_ReasonId",
          schema: "Referral",
          table: "Block",
          column: "ReasonId",
          principalSchema: "Referral",
          principalTable: "BlockReason",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_CredentialIssuance_CredentialIssuanceStatus_StatusId",
          schema: "SSI",
          table: "CredentialIssuance",
          column: "StatusId",
          principalSchema: "SSI",
          principalTable: "CredentialIssuanceStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_CredentialIssuance_SchemaType_SchemaTypeId",
          schema: "SSI",
          table: "CredentialIssuance",
          column: "SchemaTypeId",
          principalSchema: "SSI",
          principalTable: "SchemaType",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Link_Status_StatusId",
          schema: "ActionLink",
          table: "Link",
          column: "StatusId",
          principalSchema: "ActionLink",
          principalTable: "Status",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Link_LinkStatus_StatusId",
          schema: "Referral",
          table: "Link",
          column: "StatusId",
          principalSchema: "Referral",
          principalTable: "LinkStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Link_Program_ProgramId",
          schema: "Referral",
          table: "Link",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Link_User_UserId",
          schema: "Referral",
          table: "Link",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_LinkUsageStatus_StatusId",
          schema: "Referral",
          table: "LinkUsage",
          column: "StatusId",
          principalSchema: "Referral",
          principalTable: "LinkUsageStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_Link_LinkId",
          schema: "Referral",
          table: "LinkUsage",
          column: "LinkId",
          principalSchema: "Referral",
          principalTable: "Link",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_Program_ProgramId",
          schema: "Referral",
          table: "LinkUsage",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_LinkUsage_User_UserId",
          schema: "Referral",
          table: "LinkUsage",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunity_MyOpportunityAction_ActionId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "ActionId",
          principalSchema: "Opportunity",
          principalTable: "MyOpportunityAction",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunity_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunity_User_UserId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunityVerifications_MyOpportunity_MyOpportunityId",
          schema: "Opportunity",
          table: "MyOpportunityVerifications",
          column: "MyOpportunityId",
          principalSchema: "Opportunity",
          principalTable: "MyOpportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunityVerifications_OpportunityVerificationType_Veri~",
          schema: "Opportunity",
          table: "MyOpportunityVerifications",
          column: "VerificationTypeId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityVerificationType",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_OpportunityStatus_StatusId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "StatusId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_OpportunityType_TypeId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "TypeId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityType",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_Organization_OrganizationId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCategories_OpportunityCategory_CategoryId",
          schema: "Opportunity",
          table: "OpportunityCategories",
          column: "CategoryId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityCategory",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCategories_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCategories",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCountries_Country_CountryId",
          schema: "Opportunity",
          table: "OpportunityCountries",
          column: "CountryId",
          principalSchema: "Lookup",
          principalTable: "Country",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityCountries_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityCountries",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityLanguages_Language_LanguageId",
          schema: "Opportunity",
          table: "OpportunityLanguages",
          column: "LanguageId",
          principalSchema: "Lookup",
          principalTable: "Language",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityLanguages_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityLanguages",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunitySkills_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunitySkills",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunitySkills_Skill_SkillId",
          schema: "Opportunity",
          table: "OpportunitySkills",
          column: "SkillId",
          principalSchema: "Lookup",
          principalTable: "Skill",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityVerificationTypes_OpportunityVerificationType_Ve~",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes",
          column: "VerificationTypeId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityVerificationType",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OpportunityVerificationTypes_Opportunity_OpportunityId",
          schema: "Opportunity",
          table: "OpportunityVerificationTypes",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Organization_OrganizationStatus_StatusId",
          schema: "Entity",
          table: "Organization",
          column: "StatusId",
          principalSchema: "Entity",
          principalTable: "OrganizationStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationDocuments_Blob_FileId",
          schema: "Entity",
          table: "OrganizationDocuments",
          column: "FileId",
          principalSchema: "Object",
          principalTable: "Blob",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationDocuments_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationDocuments",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationProviderTypes_OrganizationProviderType_Provider~",
          schema: "Entity",
          table: "OrganizationProviderTypes",
          column: "ProviderTypeId",
          principalSchema: "Entity",
          principalTable: "OrganizationProviderType",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationProviderTypes_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationProviderTypes",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationUsers_Organization_OrganizationId",
          schema: "Entity",
          table: "OrganizationUsers",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_OrganizationUsers_User_UserId",
          schema: "Entity",
          table: "OrganizationUsers",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_ProcessingLog_Partner_PartnerId",
          schema: "PartnerSync",
          table: "ProcessingLog",
          column: "PartnerId",
          principalSchema: "PartnerSync",
          principalTable: "Partner",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_ProcessingLog_ProcessingStatus_StatusId",
          schema: "PartnerSync",
          table: "ProcessingLog",
          column: "StatusId",
          principalSchema: "PartnerSync",
          principalTable: "ProcessingStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Program_ProgramStatus_StatusId",
          schema: "Referral",
          table: "Program",
          column: "StatusId",
          principalSchema: "Referral",
          principalTable: "ProgramStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramCountries_Country_CountryId",
          schema: "Referral",
          table: "ProgramCountries",
          column: "CountryId",
          principalSchema: "Lookup",
          principalTable: "Country",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramCountries_Program_ProgramId",
          schema: "Referral",
          table: "ProgramCountries",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramPathway_Program_ProgramId",
          schema: "Referral",
          table: "ProgramPathway",
          column: "ProgramId",
          principalSchema: "Referral",
          principalTable: "Program",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramPathwayStep_ProgramPathway_PathwayId",
          schema: "Referral",
          table: "ProgramPathwayStep",
          column: "PathwayId",
          principalSchema: "Referral",
          principalTable: "ProgramPathway",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_ProgramPathwayTask_ProgramPathwayStep_StepId",
          schema: "Referral",
          table: "ProgramPathwayTask",
          column: "StepId",
          principalSchema: "Referral",
          principalTable: "ProgramPathwayStep",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Schedule_ScheduleStatus_StatusId",
          schema: "Download",
          table: "Schedule",
          column: "StatusId",
          principalSchema: "Download",
          principalTable: "ScheduleStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Schedule_User_UserId",
          schema: "Download",
          table: "Schedule",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_SchemaEntityProperty_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityProperty",
          column: "SSISchemaEntityId",
          principalSchema: "SSI",
          principalTable: "SchemaEntity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_SchemaEntityType_SchemaEntity_SSISchemaEntityId",
          schema: "SSI",
          table: "SchemaEntityType",
          column: "SSISchemaEntityId",
          principalSchema: "SSI",
          principalTable: "SchemaEntity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_SchemaEntityType_SchemaType_SSISchemaTypeId",
          schema: "SSI",
          table: "SchemaEntityType",
          column: "SSISchemaTypeId",
          principalSchema: "SSI",
          principalTable: "SchemaType",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRule_Country_StoreCountryId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "StoreCountryId",
          principalSchema: "Lookup",
          principalTable: "Country",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRule_Organization_OrganizationId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRule_StoreAccessControlRuleStatus_StatusId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "StatusId",
          principalSchema: "Marketplace",
          principalTable: "StoreAccessControlRuleStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_Opportunity_OpportunityId",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity",
          column: "OpportunityId",
          principalSchema: "Opportunity",
          principalTable: "Opportunity",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_StoreAccessControlRuleOpportunity_StoreAccessControlRule_St~",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity",
          column: "StoreAccessControlRuleId",
          principalSchema: "Marketplace",
          principalTable: "StoreAccessControlRule",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_TenantCreation_TenantCreationStatus_StatusId",
          schema: "SSI",
          table: "TenantCreation",
          column: "StatusId",
          principalSchema: "SSI",
          principalTable: "TenantCreationStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Tracking_Partner_PartnerId",
          schema: "PartnerSync",
          table: "Tracking",
          column: "PartnerId",
          principalSchema: "PartnerSync",
          principalTable: "Partner",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Transaction_TransactionStatus_StatusId",
          schema: "Reward",
          table: "Transaction",
          column: "StatusId",
          principalSchema: "Reward",
          principalTable: "TransactionStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Transaction_User_UserId",
          schema: "Reward",
          table: "Transaction",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_TransactionLog_TransactionStatus_StatusId",
          schema: "Marketplace",
          table: "TransactionLog",
          column: "StatusId",
          principalSchema: "Marketplace",
          principalTable: "TransactionStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_TransactionLog_User_UserId",
          schema: "Marketplace",
          table: "TransactionLog",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_UsageLog_Link_LinkId",
          schema: "ActionLink",
          table: "UsageLog",
          column: "LinkId",
          principalSchema: "ActionLink",
          principalTable: "Link",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_UsageLog_User_UserId",
          schema: "ActionLink",
          table: "UsageLog",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_UserLoginHistory_User_UserId",
          schema: "Entity",
          table: "UserLoginHistory",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkillOrganizations_Organization_OrganizationId",
          schema: "Entity",
          table: "UserSkillOrganizations",
          column: "OrganizationId",
          principalSchema: "Entity",
          principalTable: "Organization",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkillOrganizations_UserSkills_UserSkillId",
          schema: "Entity",
          table: "UserSkillOrganizations",
          column: "UserSkillId",
          principalSchema: "Entity",
          principalTable: "UserSkills",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkills_Skill_SkillId",
          schema: "Entity",
          table: "UserSkills",
          column: "SkillId",
          principalSchema: "Lookup",
          principalTable: "Skill",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_UserSkills_User_UserId",
          schema: "Entity",
          table: "UserSkills",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_WalletCreation_User_UserId",
          schema: "Reward",
          table: "WalletCreation",
          column: "UserId",
          principalSchema: "Entity",
          principalTable: "User",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_WalletCreation_WalletCreationStatus_StatusId",
          schema: "Reward",
          table: "WalletCreation",
          column: "StatusId",
          principalSchema: "Reward",
          principalTable: "WalletCreationStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);
    }
  }
}
