using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Initial : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.EnsureSchema(
          name: "lookup");

      migrationBuilder.EnsureSchema(
          name: "object");

      migrationBuilder.EnsureSchema(
          name: "opportunity");

      migrationBuilder.EnsureSchema(
          name: "entity");

      migrationBuilder.CreateTable(
          name: "Country",
          schema: "lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(125)", nullable: false),
            CodeAlpha2 = table.Column<string>(type: "varchar(2)", nullable: false),
            CodeAlpha3 = table.Column<string>(type: "varchar(3)", nullable: false),
            CodeNumeric = table.Column<string>(type: "varchar(3)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Country", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "File",
          schema: "object",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            ObjectKey = table.Column<string>(type: "varchar(125)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_File", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Gender",
          schema: "lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Gender", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Language",
          schema: "lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(125)", nullable: false),
            CodeAlpha2 = table.Column<string>(type: "varchar(2)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Language", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityCategory",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(125)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityCategory", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityDifficulty",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityDifficulty", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityStatus",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityStatus", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityType",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityType", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "OrganizationProviderType",
          schema: "entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OrganizationProviderType", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Skill",
          schema: "lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            InfoURL = table.Column<string>(type: "varchar(2048)", nullable: true),
            ExternalId = table.Column<string>(type: "varchar(100)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Skill", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "TimeInterval",
          schema: "lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_TimeInterval", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Organization",
          schema: "entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            WebsiteURL = table.Column<string>(type: "varchar(2048)", nullable: true),
            PrimaryContactName = table.Column<string>(type: "varchar(255)", nullable: true),
            PrimaryContactEmail = table.Column<string>(type: "varchar(320)", nullable: true),
            PrimaryContactPhone = table.Column<string>(type: "varchar(50)", nullable: true),
            VATIN = table.Column<string>(type: "varchar(255)", nullable: true),
            TaxNumber = table.Column<string>(type: "varchar(255)", nullable: true),
            RegistrationNumber = table.Column<string>(type: "varchar(255)", nullable: true),
            City = table.Column<string>(type: "varchar(50)", nullable: true),
            CountryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            StreetAddress = table.Column<string>(type: "varchar(500)", nullable: true),
            Province = table.Column<string>(type: "varchar(255)", nullable: true),
            PostalCode = table.Column<string>(type: "varchar(10)", nullable: true),
            Tagline = table.Column<string>(type: "varchar(MAX)", nullable: true),
            Biography = table.Column<string>(type: "varchar(MAX)", nullable: true),
            Approved = table.Column<bool>(type: "bit", nullable: false),
            DateApproved = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
            Active = table.Column<bool>(type: "bit", nullable: false),
            DateDeactivated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
            LogoId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            CompanyRegistrationDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Organization", x => x.Id);
            table.ForeignKey(
                      name: "FK_Organization_Country_CountryId",
                      column: x => x.CountryId,
                      principalSchema: "lookup",
                      principalTable: "Country",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Organization_File_CompanyRegistrationDocumentId",
                      column: x => x.CompanyRegistrationDocumentId,
                      principalSchema: "object",
                      principalTable: "File",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Organization_File_LogoId",
                      column: x => x.LogoId,
                      principalSchema: "object",
                      principalTable: "File",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "User",
          schema: "entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Email = table.Column<string>(type: "varchar(320)", nullable: false),
            EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
            FirstName = table.Column<string>(type: "varchar(125)", nullable: false),
            Surname = table.Column<string>(type: "varchar(125)", nullable: false),
            DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
            PhoneNumber = table.Column<string>(type: "varchar(50)", nullable: true),
            CountryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            CountryOfResidenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            PhotoId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            GenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            DateOfBirth = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
            DateLastLogin = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
            ExternalId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            ZltoWalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            ZltoWalletCountryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_User", x => x.Id);
            table.ForeignKey(
                      name: "FK_User_Country_CountryId",
                      column: x => x.CountryId,
                      principalSchema: "lookup",
                      principalTable: "Country",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_User_Country_CountryOfResidenceId",
                      column: x => x.CountryOfResidenceId,
                      principalSchema: "lookup",
                      principalTable: "Country",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_User_Country_ZltoWalletCountryId",
                      column: x => x.ZltoWalletCountryId,
                      principalSchema: "lookup",
                      principalTable: "Country",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_User_File_PhotoId",
                      column: x => x.PhotoId,
                      principalSchema: "object",
                      principalTable: "File",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_User_Gender_GenderId",
                      column: x => x.GenderId,
                      principalSchema: "lookup",
                      principalTable: "Gender",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "Opportunity",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Title = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(MAX)", nullable: false),
            TypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Instructions = table.Column<string>(type: "varchar(MAX)", nullable: true),
            URL = table.Column<string>(type: "varchar(2048)", nullable: true),
            ZltoReward = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
            YomaReward = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
            ZltoRewardPool = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
            YomaRewardPool = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
            VerificationSupported = table.Column<bool>(type: "bit", nullable: false),
            DifficultyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            CommitmentIntervalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            CommitmentIntervalCount = table.Column<short>(type: "smallint", nullable: true),
            ParticipantLimit = table.Column<int>(type: "int", nullable: true),
            ParticipantCount = table.Column<int>(type: "int", nullable: true),
            StatusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Keywords = table.Column<string>(type: "varchar(500)", nullable: true),
            DateStart = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
            DateEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
            CreatedBy = table.Column<string>(type: "varchar(320)", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
            ModifiedBy = table.Column<string>(type: "varchar(320)", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Opportunity", x => x.Id);
            table.ForeignKey(
                      name: "FK_Opportunity_OpportunityDifficulty_DifficultyId",
                      column: x => x.DifficultyId,
                      principalSchema: "opportunity",
                      principalTable: "OpportunityDifficulty",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Opportunity_OpportunityStatus_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "opportunity",
                      principalTable: "OpportunityStatus",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Opportunity_OpportunityType_TypeId",
                      column: x => x.TypeId,
                      principalSchema: "opportunity",
                      principalTable: "OpportunityType",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Opportunity_Organization_OrganizationId",
                      column: x => x.OrganizationId,
                      principalSchema: "entity",
                      principalTable: "Organization",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Opportunity_TimeInterval_CommitmentIntervalId",
                      column: x => x.CommitmentIntervalId,
                      principalSchema: "lookup",
                      principalTable: "TimeInterval",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "OrganizationProviderTypes",
          schema: "entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            ProviderTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OrganizationProviderTypes", x => x.Id);
            table.ForeignKey(
                      name: "FK_OrganizationProviderTypes_OrganizationProviderType_ProviderTypeId",
                      column: x => x.ProviderTypeId,
                      principalSchema: "entity",
                      principalTable: "OrganizationProviderType",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_OrganizationProviderTypes_Organization_OrganizationId",
                      column: x => x.OrganizationId,
                      principalSchema: "entity",
                      principalTable: "Organization",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "OrganizationUsers",
          schema: "entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OrganizationUsers", x => x.Id);
            table.ForeignKey(
                      name: "FK_OrganizationUsers_Organization_OrganizationId",
                      column: x => x.OrganizationId,
                      principalSchema: "entity",
                      principalTable: "Organization",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_OrganizationUsers_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "UserSkills",
          schema: "entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            SkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_UserSkills", x => x.Id);
            table.ForeignKey(
                      name: "FK_UserSkills_Skill_SkillId",
                      column: x => x.SkillId,
                      principalSchema: "lookup",
                      principalTable: "Skill",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_UserSkills_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityCategories",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityCategories", x => x.Id);
            table.ForeignKey(
                      name: "FK_OpportunityCategories_OpportunityCategory_CategoryId",
                      column: x => x.CategoryId,
                      principalSchema: "opportunity",
                      principalTable: "OpportunityCategory",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_OpportunityCategories_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityCountries",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            CountryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityCountries", x => x.Id);
            table.ForeignKey(
                      name: "FK_OpportunityCountries_Country_CountryId",
                      column: x => x.CountryId,
                      principalSchema: "lookup",
                      principalTable: "Country",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_OpportunityCountries_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "OpportunityLanguages",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            LanguageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunityLanguages", x => x.Id);
            table.ForeignKey(
                      name: "FK_OpportunityLanguages_Language_LanguageId",
                      column: x => x.LanguageId,
                      principalSchema: "lookup",
                      principalTable: "Language",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_OpportunityLanguages_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "OpportunitySkill",
          schema: "opportunity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            SkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_OpportunitySkill", x => x.Id);
            table.ForeignKey(
                      name: "FK_OpportunitySkill_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_OpportunitySkill_Skill_SkillId",
                      column: x => x.SkillId,
                      principalSchema: "lookup",
                      principalTable: "Skill",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_Country_CodeAlpha2",
          schema: "lookup",
          table: "Country",
          column: "CodeAlpha2",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Country_CodeAlpha3",
          schema: "lookup",
          table: "Country",
          column: "CodeAlpha3",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Country_CodeNumeric",
          schema: "lookup",
          table: "Country",
          column: "CodeNumeric",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Country_Name",
          schema: "lookup",
          table: "Country",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_File_ObjectKey",
          schema: "object",
          table: "File",
          column: "ObjectKey",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Gender_Name",
          schema: "lookup",
          table: "Gender",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Language_CodeAlpha2",
          schema: "lookup",
          table: "Language",
          column: "CodeAlpha2",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Language_Name",
          schema: "lookup",
          table: "Language",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_CommitmentIntervalId",
          schema: "opportunity",
          table: "Opportunity",
          column: "CommitmentIntervalId");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_DifficultyId",
          schema: "opportunity",
          table: "Opportunity",
          column: "DifficultyId");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_OrganizationId",
          schema: "opportunity",
          table: "Opportunity",
          column: "OrganizationId");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_StatusId",
          schema: "opportunity",
          table: "Opportunity",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_Title",
          schema: "opportunity",
          table: "Opportunity",
          column: "Title",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_DifficultyId_CommitmentIntervalId_StatusId_Keywords_DateStart_DateEnd_DateCreated_DateModi~",
          schema: "opportunity",
          table: "Opportunity",
          columns: new[] { "TypeId", "OrganizationId", "DifficultyId", "CommitmentIntervalId", "StatusId", "Keywords", "DateStart", "DateEnd", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityCategories_CategoryId",
          schema: "opportunity",
          table: "OpportunityCategories",
          column: "CategoryId");

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityCategories_OpportunityId_CategoryId",
          schema: "opportunity",
          table: "OpportunityCategories",
          columns: new[] { "OpportunityId", "CategoryId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityCategory_Name",
          schema: "opportunity",
          table: "OpportunityCategory",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityCountries_CountryId",
          schema: "opportunity",
          table: "OpportunityCountries",
          column: "CountryId");

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityCountries_OpportunityId_CountryId",
          schema: "opportunity",
          table: "OpportunityCountries",
          columns: new[] { "OpportunityId", "CountryId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityDifficulty_Name",
          schema: "opportunity",
          table: "OpportunityDifficulty",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityLanguages_LanguageId",
          schema: "opportunity",
          table: "OpportunityLanguages",
          column: "LanguageId");

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityLanguages_OpportunityId_LanguageId",
          schema: "opportunity",
          table: "OpportunityLanguages",
          columns: new[] { "OpportunityId", "LanguageId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunitySkill_OpportunityId_SkillId",
          schema: "opportunity",
          table: "OpportunitySkill",
          columns: new[] { "OpportunityId", "SkillId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunitySkill_SkillId",
          schema: "opportunity",
          table: "OpportunitySkill",
          column: "SkillId");

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityStatus_Name",
          schema: "opportunity",
          table: "OpportunityStatus",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OpportunityType_Name",
          schema: "opportunity",
          table: "OpportunityType",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Organization_Approved_Active_DateModified_DateCreated",
          schema: "entity",
          table: "Organization",
          columns: new[] { "Approved", "Active", "DateModified", "DateCreated" });

      migrationBuilder.CreateIndex(
          name: "IX_Organization_CompanyRegistrationDocumentId",
          schema: "entity",
          table: "Organization",
          column: "CompanyRegistrationDocumentId");

      migrationBuilder.CreateIndex(
          name: "IX_Organization_CountryId",
          schema: "entity",
          table: "Organization",
          column: "CountryId");

      migrationBuilder.CreateIndex(
          name: "IX_Organization_LogoId",
          schema: "entity",
          table: "Organization",
          column: "LogoId");

      migrationBuilder.CreateIndex(
          name: "IX_Organization_Name",
          schema: "entity",
          table: "Organization",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OrganizationProviderType_Name",
          schema: "entity",
          table: "OrganizationProviderType",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OrganizationProviderTypes_OrganizationId_ProviderTypeId",
          schema: "entity",
          table: "OrganizationProviderTypes",
          columns: new[] { "OrganizationId", "ProviderTypeId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OrganizationProviderTypes_ProviderTypeId",
          schema: "entity",
          table: "OrganizationProviderTypes",
          column: "ProviderTypeId");

      migrationBuilder.CreateIndex(
          name: "IX_OrganizationUsers_OrganizationId_UserId",
          schema: "entity",
          table: "OrganizationUsers",
          columns: new[] { "OrganizationId", "UserId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_OrganizationUsers_UserId",
          schema: "entity",
          table: "OrganizationUsers",
          column: "UserId");

      migrationBuilder.CreateIndex(
          name: "IX_Skill_ExternalId",
          schema: "lookup",
          table: "Skill",
          column: "ExternalId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Skill_Name",
          schema: "lookup",
          table: "Skill",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_TimeInterval_Name",
          schema: "lookup",
          table: "TimeInterval",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_CountryId",
          schema: "entity",
          table: "User",
          column: "CountryId");

      migrationBuilder.CreateIndex(
          name: "IX_User_CountryOfResidenceId",
          schema: "entity",
          table: "User",
          column: "CountryOfResidenceId");

      migrationBuilder.CreateIndex(
          name: "IX_User_Email",
          schema: "entity",
          table: "User",
          column: "Email",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_User_FirstName_Surname_PhoneNumber_ExternalId_DateCreated_DateModified",
          schema: "entity",
          table: "User",
          columns: new[] { "FirstName", "Surname", "PhoneNumber", "ExternalId", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_User_GenderId",
          schema: "entity",
          table: "User",
          column: "GenderId");

      migrationBuilder.CreateIndex(
          name: "IX_User_PhotoId",
          schema: "entity",
          table: "User",
          column: "PhotoId");

      migrationBuilder.CreateIndex(
          name: "IX_User_ZltoWalletCountryId",
          schema: "entity",
          table: "User",
          column: "ZltoWalletCountryId");

      migrationBuilder.CreateIndex(
          name: "IX_UserSkills_SkillId",
          schema: "entity",
          table: "UserSkills",
          column: "SkillId");

      migrationBuilder.CreateIndex(
          name: "IX_UserSkills_UserId_SkillId",
          schema: "entity",
          table: "UserSkills",
          columns: new[] { "UserId", "SkillId" },
          unique: true);

      ApplicationDb_Initial_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "OpportunityCategories",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "OpportunityCountries",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "OpportunityLanguages",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "OpportunitySkill",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "OrganizationProviderTypes",
          schema: "entity");

      migrationBuilder.DropTable(
          name: "OrganizationUsers",
          schema: "entity");

      migrationBuilder.DropTable(
          name: "UserSkills",
          schema: "entity");

      migrationBuilder.DropTable(
          name: "OpportunityCategory",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "Language",
          schema: "lookup");

      migrationBuilder.DropTable(
          name: "Opportunity",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "OrganizationProviderType",
          schema: "entity");

      migrationBuilder.DropTable(
          name: "Skill",
          schema: "lookup");

      migrationBuilder.DropTable(
          name: "User",
          schema: "entity");

      migrationBuilder.DropTable(
          name: "OpportunityDifficulty",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "OpportunityStatus",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "OpportunityType",
          schema: "opportunity");

      migrationBuilder.DropTable(
          name: "Organization",
          schema: "entity");

      migrationBuilder.DropTable(
          name: "TimeInterval",
          schema: "lookup");

      migrationBuilder.DropTable(
          name: "Gender",
          schema: "lookup");

      migrationBuilder.DropTable(
          name: "Country",
          schema: "lookup");

      migrationBuilder.DropTable(
          name: "File",
          schema: "object");
    }
  }
}
