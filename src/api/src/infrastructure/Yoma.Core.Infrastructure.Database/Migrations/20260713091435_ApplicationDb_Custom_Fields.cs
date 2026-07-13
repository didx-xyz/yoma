using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Custom_Fields : Migration
  {
    private static readonly string[] GIN_IndexOperators = ["gin_trgm_ops"];

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
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
          name: "IX_CustomFieldValue_CustomFieldDefinitionId_MyOpportunityId",
          schema: "Core",
          table: "CustomFieldValue",
          columns: ["CustomFieldDefinitionId", "MyOpportunityId"]);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldValue_CustomFieldDefinitionId_OpportunityId",
          schema: "Core",
          table: "CustomFieldValue",
          columns: ["CustomFieldDefinitionId", "OpportunityId"]);

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
          .Annotation("Npgsql:IndexOperators", GIN_IndexOperators);

      ApplicationDb_Custom_Fields_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
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
    }
  }
}
