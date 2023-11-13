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
                name: "Object");

            migrationBuilder.EnsureSchema(
                name: "Lookup");

            migrationBuilder.EnsureSchema(
                name: "SSI");

            migrationBuilder.EnsureSchema(
                name: "Opportunity");

            migrationBuilder.EnsureSchema(
                name: "Entity");

            migrationBuilder.CreateTable(
                name: "Blob",
                schema: "Object",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StorageType = table.Column<string>(type: "varchar(25)", nullable: false),
                    FileType = table.Column<string>(type: "varchar(25)", nullable: false),
                    Key = table.Column<string>(type: "varchar(125)", nullable: false),
                    ContentType = table.Column<string>(type: "varchar(127)", nullable: false),
                    OriginalFileName = table.Column<string>(type: "varchar(255)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Blob", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Country",
                schema: "Lookup",
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
                name: "CredentialIssuanceStatus",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(20)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CredentialIssuanceStatus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Gender",
                schema: "Lookup",
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
                schema: "Lookup",
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
                name: "MyOpportunityAction",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(125)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MyOpportunityAction", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MyOpportunityVerificationStatus",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(125)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MyOpportunityVerificationStatus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OpportunityCategory",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(125)", nullable: false),
                    ImageURL = table.Column<string>(type: "varchar(2048)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpportunityCategory", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OpportunityDifficulty",
                schema: "Opportunity",
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
                schema: "Opportunity",
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
                schema: "Opportunity",
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
                name: "OpportunityVerificationType",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(125)", nullable: false),
                    DisplayName = table.Column<string>(type: "varchar(125)", nullable: false),
                    Description = table.Column<string>(type: "varchar(255)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpportunityVerificationType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationProviderType",
                schema: "Entity",
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
                name: "OrganizationStatus",
                schema: "Entity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationStatus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SchemaEntity",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TypeName = table.Column<string>(type: "varchar(255)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchemaEntity", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SchemaType",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(125)", nullable: false),
                    Description = table.Column<string>(type: "varchar(255)", nullable: false),
                    SupportMultiple = table.Column<bool>(type: "bit", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchemaType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Skill",
                schema: "Lookup",
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
                name: "TenantCreationStatus",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(20)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantCreationStatus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TimeInterval",
                schema: "Lookup",
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
                name: "User",
                schema: "Entity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "varchar(320)", nullable: false),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    FirstName = table.Column<string>(type: "varchar(125)", nullable: false),
                    Surname = table.Column<string>(type: "varchar(125)", nullable: false),
                    DisplayName = table.Column<string>(type: "varchar(255)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "varchar(50)", nullable: true),
                    CountryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CountryOfResidenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PhotoId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DateOfBirth = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DateLastLogin = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ExternalId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ZltoWalletId = table.Column<string>(type: "varchar(50)", nullable: true),
                    DateZltoWalletCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    YoIDOnboarded = table.Column<bool>(type: "bit", nullable: true),
                    DateYoIDOnboarded = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.Id);
                    table.ForeignKey(
                        name: "FK_User_Blob_PhotoId",
                        column: x => x.PhotoId,
                        principalSchema: "Object",
                        principalTable: "Blob",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_User_Country_CountryId",
                        column: x => x.CountryId,
                        principalSchema: "Lookup",
                        principalTable: "Country",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_User_Country_CountryOfResidenceId",
                        column: x => x.CountryOfResidenceId,
                        principalSchema: "Lookup",
                        principalTable: "Country",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_User_Gender_GenderId",
                        column: x => x.GenderId,
                        principalSchema: "Lookup",
                        principalTable: "Gender",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Organization",
                schema: "Entity",
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
                    StatusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommentApproval = table.Column<string>(type: "varchar(500)", nullable: true),
                    DateStatusModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LogoId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organization", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Organization_Blob_LogoId",
                        column: x => x.LogoId,
                        principalSchema: "Object",
                        principalTable: "Blob",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Organization_Country_CountryId",
                        column: x => x.CountryId,
                        principalSchema: "Lookup",
                        principalTable: "Country",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Organization_OrganizationStatus_StatusId",
                        column: x => x.StatusId,
                        principalSchema: "Entity",
                        principalTable: "OrganizationStatus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SchemaEntityProperty",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SSISchemaEntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(50)", nullable: false),
                    NameDisplay = table.Column<string>(type: "varchar(50)", nullable: false),
                    Description = table.Column<string>(type: "varchar(125)", nullable: false),
                    Required = table.Column<bool>(type: "bit", nullable: false),
                    SystemType = table.Column<string>(type: "varchar(50)", nullable: true),
                    Format = table.Column<string>(type: "varchar(125)", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchemaEntityProperty", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SchemaEntityProperty_SchemaEntity_SSISchemaEntityId",
                        column: x => x.SSISchemaEntityId,
                        principalSchema: "SSI",
                        principalTable: "SchemaEntity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SchemaEntityType",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SSISchemaEntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SSISchemaTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchemaEntityType", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SchemaEntityType_SchemaEntity_SSISchemaEntityId",
                        column: x => x.SSISchemaEntityId,
                        principalSchema: "SSI",
                        principalTable: "SchemaEntity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SchemaEntityType_SchemaType_SSISchemaTypeId",
                        column: x => x.SSISchemaTypeId,
                        principalSchema: "SSI",
                        principalTable: "SchemaType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSkills",
                schema: "Entity",
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
                        principalSchema: "Lookup",
                        principalTable: "Skill",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserSkills_User_UserId",
                        column: x => x.UserId,
                        principalSchema: "Entity",
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Opportunity",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(MAX)", nullable: false),
                    TypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Instructions = table.Column<string>(type: "nvarchar(MAX)", nullable: true),
                    URL = table.Column<string>(type: "varchar(2048)", nullable: true),
                    ZltoReward = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    ZltoRewardPool = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    ZltoRewardCumulative = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    YomaReward = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    YomaRewardPool = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    YomaRewardCumulative = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    VerificationEnabled = table.Column<bool>(type: "bit", nullable: false),
                    VerificationMethod = table.Column<string>(type: "varchar(20)", nullable: true),
                    DifficultyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommitmentIntervalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommitmentIntervalCount = table.Column<short>(type: "smallint", nullable: false),
                    ParticipantLimit = table.Column<int>(type: "int", nullable: true),
                    ParticipantCount = table.Column<int>(type: "int", nullable: true),
                    StatusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Keywords = table.Column<string>(type: "varchar(500)", nullable: true),
                    DateStart = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DateEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CredentialIssuanceEnabled = table.Column<bool>(type: "bit", nullable: false),
                    SSISchemaName = table.Column<string>(type: "varchar(255)", nullable: true),
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
                        principalSchema: "Opportunity",
                        principalTable: "OpportunityDifficulty",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Opportunity_OpportunityStatus_StatusId",
                        column: x => x.StatusId,
                        principalSchema: "Opportunity",
                        principalTable: "OpportunityStatus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Opportunity_OpportunityType_TypeId",
                        column: x => x.TypeId,
                        principalSchema: "Opportunity",
                        principalTable: "OpportunityType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Opportunity_Organization_OrganizationId",
                        column: x => x.OrganizationId,
                        principalSchema: "Entity",
                        principalTable: "Organization",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Opportunity_TimeInterval_CommitmentIntervalId",
                        column: x => x.CommitmentIntervalId,
                        principalSchema: "Lookup",
                        principalTable: "TimeInterval",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationDocuments",
                schema: "Entity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "varchar(50)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrganizationDocuments_Blob_FileId",
                        column: x => x.FileId,
                        principalSchema: "Object",
                        principalTable: "Blob",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrganizationDocuments_Organization_OrganizationId",
                        column: x => x.OrganizationId,
                        principalSchema: "Entity",
                        principalTable: "Organization",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationProviderTypes",
                schema: "Entity",
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
                        principalSchema: "Entity",
                        principalTable: "OrganizationProviderType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrganizationProviderTypes_Organization_OrganizationId",
                        column: x => x.OrganizationId,
                        principalSchema: "Entity",
                        principalTable: "Organization",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationUsers",
                schema: "Entity",
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
                        principalSchema: "Entity",
                        principalTable: "Organization",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrganizationUsers_User_UserId",
                        column: x => x.UserId,
                        principalSchema: "Entity",
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TenantCreation",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityType = table.Column<string>(type: "varchar(25)", nullable: false),
                    StatusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TenantId = table.Column<string>(type: "varchar(50)", nullable: true),
                    ErrorReason = table.Column<string>(type: "varchar(MAX)", nullable: true),
                    RetryCount = table.Column<byte>(type: "tinyint", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantCreation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantCreation_Organization_OrganizationId",
                        column: x => x.OrganizationId,
                        principalSchema: "Entity",
                        principalTable: "Organization",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TenantCreation_TenantCreationStatus_StatusId",
                        column: x => x.StatusId,
                        principalSchema: "SSI",
                        principalTable: "TenantCreationStatus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TenantCreation_User_UserId",
                        column: x => x.UserId,
                        principalSchema: "Entity",
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MyOpportunity",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VerificationStatusId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CommentVerification = table.Column<string>(type: "varchar(500)", nullable: true),
                    DateStart = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DateEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DateCompleted = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ZltoReward = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    YomaReward = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MyOpportunity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MyOpportunity_MyOpportunityAction_ActionId",
                        column: x => x.ActionId,
                        principalSchema: "Opportunity",
                        principalTable: "MyOpportunityAction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MyOpportunity_MyOpportunityVerificationStatus_VerificationStatusId",
                        column: x => x.VerificationStatusId,
                        principalSchema: "Opportunity",
                        principalTable: "MyOpportunityVerificationStatus",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MyOpportunity_Opportunity_OpportunityId",
                        column: x => x.OpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "Opportunity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MyOpportunity_User_UserId",
                        column: x => x.UserId,
                        principalSchema: "Entity",
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpportunityCategories",
                schema: "Opportunity",
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
                        principalSchema: "Opportunity",
                        principalTable: "OpportunityCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OpportunityCategories_Opportunity_OpportunityId",
                        column: x => x.OpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "Opportunity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpportunityCountries",
                schema: "Opportunity",
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
                        principalSchema: "Lookup",
                        principalTable: "Country",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OpportunityCountries_Opportunity_OpportunityId",
                        column: x => x.OpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "Opportunity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpportunityLanguages",
                schema: "Opportunity",
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
                        principalSchema: "Lookup",
                        principalTable: "Language",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OpportunityLanguages_Opportunity_OpportunityId",
                        column: x => x.OpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "Opportunity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpportunitySkills",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpportunitySkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OpportunitySkills_Opportunity_OpportunityId",
                        column: x => x.OpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "Opportunity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OpportunitySkills_Skill_SkillId",
                        column: x => x.SkillId,
                        principalSchema: "Lookup",
                        principalTable: "Skill",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpportunityVerificationTypes",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VerificationTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "varchar(255)", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpportunityVerificationTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OpportunityVerificationTypes_OpportunityVerificationType_VerificationTypeId",
                        column: x => x.VerificationTypeId,
                        principalSchema: "Opportunity",
                        principalTable: "OpportunityVerificationType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OpportunityVerificationTypes_Opportunity_OpportunityId",
                        column: x => x.OpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "Opportunity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CredentialIssuance",
                schema: "SSI",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SchemaTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArtifactType = table.Column<string>(type: "varchar(25)", nullable: false),
                    SchemaName = table.Column<string>(type: "varchar(125)", nullable: false),
                    SchemaVersion = table.Column<string>(type: "varchar(20)", nullable: false),
                    StatusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MyOpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CredentialId = table.Column<string>(type: "varchar(50)", nullable: true),
                    ErrorReason = table.Column<string>(type: "varchar(MAX)", nullable: true),
                    RetryCount = table.Column<byte>(type: "tinyint", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CredentialIssuance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CredentialIssuance_CredentialIssuanceStatus_StatusId",
                        column: x => x.StatusId,
                        principalSchema: "SSI",
                        principalTable: "CredentialIssuanceStatus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CredentialIssuance_MyOpportunity_MyOpportunityId",
                        column: x => x.MyOpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "MyOpportunity",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CredentialIssuance_Organization_OrganizationId",
                        column: x => x.OrganizationId,
                        principalSchema: "Entity",
                        principalTable: "Organization",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CredentialIssuance_SchemaType_SchemaTypeId",
                        column: x => x.SchemaTypeId,
                        principalSchema: "SSI",
                        principalTable: "SchemaType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CredentialIssuance_User_UserId",
                        column: x => x.UserId,
                        principalSchema: "Entity",
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MyOpportunityVerifications",
                schema: "Opportunity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MyOpportunityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VerificationTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GeometryProperties = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FileId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MyOpportunityVerifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MyOpportunityVerifications_Blob_FileId",
                        column: x => x.FileId,
                        principalSchema: "Object",
                        principalTable: "Blob",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MyOpportunityVerifications_MyOpportunity_MyOpportunityId",
                        column: x => x.MyOpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "MyOpportunity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MyOpportunityVerifications_OpportunityVerificationType_VerificationTypeId",
                        column: x => x.VerificationTypeId,
                        principalSchema: "Opportunity",
                        principalTable: "OpportunityVerificationType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Blob_Key",
                schema: "Object",
                table: "Blob",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Blob_StorageType_FileType",
                schema: "Object",
                table: "Blob",
                columns: new[] { "StorageType", "FileType" });

            migrationBuilder.CreateIndex(
                name: "IX_Country_CodeAlpha2",
                schema: "Lookup",
                table: "Country",
                column: "CodeAlpha2",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Country_CodeAlpha3",
                schema: "Lookup",
                table: "Country",
                column: "CodeAlpha3",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Country_CodeNumeric",
                schema: "Lookup",
                table: "Country",
                column: "CodeNumeric",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Country_Name",
                schema: "Lookup",
                table: "Country",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CredentialIssuance_MyOpportunityId",
                schema: "SSI",
                table: "CredentialIssuance",
                column: "MyOpportunityId");

            migrationBuilder.CreateIndex(
                name: "IX_CredentialIssuance_OrganizationId",
                schema: "SSI",
                table: "CredentialIssuance",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CredentialIssuance_SchemaName_UserId_OrganizationId_MyOpportunityId",
                schema: "SSI",
                table: "CredentialIssuance",
                columns: new[] { "SchemaName", "UserId", "OrganizationId", "MyOpportunityId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CredentialIssuance_SchemaTypeId_ArtifactType_SchemaName_StatusId_DateCreated_DateModified",
                schema: "SSI",
                table: "CredentialIssuance",
                columns: new[] { "SchemaTypeId", "ArtifactType", "SchemaName", "StatusId", "DateCreated", "DateModified" });

            migrationBuilder.CreateIndex(
                name: "IX_CredentialIssuance_StatusId",
                schema: "SSI",
                table: "CredentialIssuance",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_CredentialIssuance_UserId",
                schema: "SSI",
                table: "CredentialIssuance",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CredentialIssuanceStatus_Name",
                schema: "SSI",
                table: "CredentialIssuanceStatus",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Gender_Name",
                schema: "Lookup",
                table: "Gender",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Language_CodeAlpha2",
                schema: "Lookup",
                table: "Language",
                column: "CodeAlpha2",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Language_Name",
                schema: "Lookup",
                table: "Language",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunity_ActionId",
                schema: "Opportunity",
                table: "MyOpportunity",
                column: "ActionId");

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunity_OpportunityId",
                schema: "Opportunity",
                table: "MyOpportunity",
                column: "OpportunityId");

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunity_UserId_OpportunityId_ActionId",
                schema: "Opportunity",
                table: "MyOpportunity",
                columns: new[] { "UserId", "OpportunityId", "ActionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunity_VerificationStatusId_DateCompleted_ZltoReward_YomaReward_DateCreated_DateModified",
                schema: "Opportunity",
                table: "MyOpportunity",
                columns: new[] { "VerificationStatusId", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified" });

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunityAction_Name",
                schema: "Opportunity",
                table: "MyOpportunityAction",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunityVerifications_FileId",
                schema: "Opportunity",
                table: "MyOpportunityVerifications",
                column: "FileId");

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunityVerifications_MyOpportunityId_VerificationTypeId",
                schema: "Opportunity",
                table: "MyOpportunityVerifications",
                columns: new[] { "MyOpportunityId", "VerificationTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunityVerifications_VerificationTypeId",
                schema: "Opportunity",
                table: "MyOpportunityVerifications",
                column: "VerificationTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_MyOpportunityVerificationStatus_Name",
                schema: "Opportunity",
                table: "MyOpportunityVerificationStatus",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Opportunity_CommitmentIntervalId",
                schema: "Opportunity",
                table: "Opportunity",
                column: "CommitmentIntervalId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunity_DifficultyId",
                schema: "Opportunity",
                table: "Opportunity",
                column: "DifficultyId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunity_OrganizationId",
                schema: "Opportunity",
                table: "Opportunity",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunity_StatusId",
                schema: "Opportunity",
                table: "Opportunity",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunity_Title",
                schema: "Opportunity",
                table: "Opportunity",
                column: "Title",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_CommitmentIntervalId_CommitmentIntervalCount_StatusId_Keywords_Dat~",
                schema: "Opportunity",
                table: "Opportunity",
                columns: new[] { "TypeId", "OrganizationId", "ZltoReward", "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "DateCreated", "DateModified" });

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityCategories_CategoryId",
                schema: "Opportunity",
                table: "OpportunityCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityCategories_OpportunityId_CategoryId",
                schema: "Opportunity",
                table: "OpportunityCategories",
                columns: new[] { "OpportunityId", "CategoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityCategory_Name",
                schema: "Opportunity",
                table: "OpportunityCategory",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityCountries_CountryId",
                schema: "Opportunity",
                table: "OpportunityCountries",
                column: "CountryId");

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityCountries_OpportunityId_CountryId",
                schema: "Opportunity",
                table: "OpportunityCountries",
                columns: new[] { "OpportunityId", "CountryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityDifficulty_Name",
                schema: "Opportunity",
                table: "OpportunityDifficulty",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityLanguages_LanguageId",
                schema: "Opportunity",
                table: "OpportunityLanguages",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityLanguages_OpportunityId_LanguageId",
                schema: "Opportunity",
                table: "OpportunityLanguages",
                columns: new[] { "OpportunityId", "LanguageId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunitySkills_OpportunityId_SkillId",
                schema: "Opportunity",
                table: "OpportunitySkills",
                columns: new[] { "OpportunityId", "SkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunitySkills_SkillId",
                schema: "Opportunity",
                table: "OpportunitySkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityStatus_Name",
                schema: "Opportunity",
                table: "OpportunityStatus",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityType_Name",
                schema: "Opportunity",
                table: "OpportunityType",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityVerificationType_Name",
                schema: "Opportunity",
                table: "OpportunityVerificationType",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityVerificationTypes_OpportunityId_VerificationTypeId",
                schema: "Opportunity",
                table: "OpportunityVerificationTypes",
                columns: new[] { "OpportunityId", "VerificationTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityVerificationTypes_VerificationTypeId",
                schema: "Opportunity",
                table: "OpportunityVerificationTypes",
                column: "VerificationTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Organization_CountryId",
                schema: "Entity",
                table: "Organization",
                column: "CountryId");

            migrationBuilder.CreateIndex(
                name: "IX_Organization_LogoId",
                schema: "Entity",
                table: "Organization",
                column: "LogoId");

            migrationBuilder.CreateIndex(
                name: "IX_Organization_Name",
                schema: "Entity",
                table: "Organization",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organization_StatusId_DateStatusModified_DateModified_DateCreated",
                schema: "Entity",
                table: "Organization",
                columns: new[] { "StatusId", "DateStatusModified", "DateModified", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationDocuments_FileId",
                schema: "Entity",
                table: "OrganizationDocuments",
                column: "FileId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationDocuments_OrganizationId_Type_DateCreated",
                schema: "Entity",
                table: "OrganizationDocuments",
                columns: new[] { "OrganizationId", "Type", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationProviderType_Name",
                schema: "Entity",
                table: "OrganizationProviderType",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationProviderTypes_OrganizationId_ProviderTypeId",
                schema: "Entity",
                table: "OrganizationProviderTypes",
                columns: new[] { "OrganizationId", "ProviderTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationProviderTypes_ProviderTypeId",
                schema: "Entity",
                table: "OrganizationProviderTypes",
                column: "ProviderTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationStatus_Name",
                schema: "Entity",
                table: "OrganizationStatus",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationUsers_OrganizationId_UserId",
                schema: "Entity",
                table: "OrganizationUsers",
                columns: new[] { "OrganizationId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationUsers_UserId",
                schema: "Entity",
                table: "OrganizationUsers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SchemaEntity_TypeName",
                schema: "SSI",
                table: "SchemaEntity",
                column: "TypeName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SchemaEntityProperty_SSISchemaEntityId_Name",
                schema: "SSI",
                table: "SchemaEntityProperty",
                columns: new[] { "SSISchemaEntityId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SchemaEntityType_SSISchemaEntityId_SSISchemaTypeId",
                schema: "SSI",
                table: "SchemaEntityType",
                columns: new[] { "SSISchemaEntityId", "SSISchemaTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SchemaEntityType_SSISchemaTypeId",
                schema: "SSI",
                table: "SchemaEntityType",
                column: "SSISchemaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_SchemaType_Name",
                schema: "SSI",
                table: "SchemaType",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skill_ExternalId",
                schema: "Lookup",
                table: "Skill",
                column: "ExternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skill_Name",
                schema: "Lookup",
                table: "Skill",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TenantCreation_EntityType_UserId_OrganizationId",
                schema: "SSI",
                table: "TenantCreation",
                columns: new[] { "EntityType", "UserId", "OrganizationId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TenantCreation_OrganizationId",
                schema: "SSI",
                table: "TenantCreation",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCreation_StatusId_DateCreated_DateModified",
                schema: "SSI",
                table: "TenantCreation",
                columns: new[] { "StatusId", "DateCreated", "DateModified" });

            migrationBuilder.CreateIndex(
                name: "IX_TenantCreation_UserId",
                schema: "SSI",
                table: "TenantCreation",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCreationStatus_Name",
                schema: "SSI",
                table: "TenantCreationStatus",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TimeInterval_Name",
                schema: "Lookup",
                table: "TimeInterval",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_CountryId",
                schema: "Entity",
                table: "User",
                column: "CountryId");

            migrationBuilder.CreateIndex(
                name: "IX_User_CountryOfResidenceId",
                schema: "Entity",
                table: "User",
                column: "CountryOfResidenceId");

            migrationBuilder.CreateIndex(
                name: "IX_User_Email",
                schema: "Entity",
                table: "User",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_FirstName_Surname_EmailConfirmed_PhoneNumber_ExternalId_ZltoWalletId_DateZltoWalletCreated_YoIDOnboarded_DateYoIDOnboar~",
                schema: "Entity",
                table: "User",
                columns: new[] { "FirstName", "Surname", "EmailConfirmed", "PhoneNumber", "ExternalId", "ZltoWalletId", "DateZltoWalletCreated", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified" });

            migrationBuilder.CreateIndex(
                name: "IX_User_GenderId",
                schema: "Entity",
                table: "User",
                column: "GenderId");

            migrationBuilder.CreateIndex(
                name: "IX_User_PhotoId",
                schema: "Entity",
                table: "User",
                column: "PhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSkills_SkillId",
                schema: "Entity",
                table: "UserSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSkills_UserId_SkillId",
                schema: "Entity",
                table: "UserSkills",
                columns: new[] { "UserId", "SkillId" },
                unique: true);

            ApplicationDb_Initial_Seeding.Seed(migrationBuilder);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CredentialIssuance",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "MyOpportunityVerifications",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunityCategories",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunityCountries",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunityLanguages",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunitySkills",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunityVerificationTypes",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OrganizationDocuments",
                schema: "Entity");

            migrationBuilder.DropTable(
                name: "OrganizationProviderTypes",
                schema: "Entity");

            migrationBuilder.DropTable(
                name: "OrganizationUsers",
                schema: "Entity");

            migrationBuilder.DropTable(
                name: "SchemaEntityProperty",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "SchemaEntityType",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "TenantCreation",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "UserSkills",
                schema: "Entity");

            migrationBuilder.DropTable(
                name: "CredentialIssuanceStatus",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "MyOpportunity",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunityCategory",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "Language",
                schema: "Lookup");

            migrationBuilder.DropTable(
                name: "OpportunityVerificationType",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OrganizationProviderType",
                schema: "Entity");

            migrationBuilder.DropTable(
                name: "SchemaEntity",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "SchemaType",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "TenantCreationStatus",
                schema: "SSI");

            migrationBuilder.DropTable(
                name: "Skill",
                schema: "Lookup");

            migrationBuilder.DropTable(
                name: "MyOpportunityAction",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "MyOpportunityVerificationStatus",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "Opportunity",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "User",
                schema: "Entity");

            migrationBuilder.DropTable(
                name: "OpportunityDifficulty",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunityStatus",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "OpportunityType",
                schema: "Opportunity");

            migrationBuilder.DropTable(
                name: "Organization",
                schema: "Entity");

            migrationBuilder.DropTable(
                name: "TimeInterval",
                schema: "Lookup");

            migrationBuilder.DropTable(
                name: "Gender",
                schema: "Lookup");

            migrationBuilder.DropTable(
                name: "Blob",
                schema: "Object");

            migrationBuilder.DropTable(
                name: "Country",
                schema: "Lookup");

            migrationBuilder.DropTable(
                name: "OrganizationStatus",
                schema: "Entity");
        }
    }
}
