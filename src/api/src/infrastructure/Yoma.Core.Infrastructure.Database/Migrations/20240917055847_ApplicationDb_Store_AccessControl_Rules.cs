using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Store_AccessControl_Rules : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_User_FirstName_Surname_EmailConfirmed_PhoneNumber_ExternalI~",
          schema: "Entity",
          table: "User");

      migrationBuilder.CreateTable(
          name: "StoreAccessControlRuleStatus",
          schema: "Marketplace",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(30)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_StoreAccessControlRuleStatus", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "StoreAccessControlRule",
          schema: "Marketplace",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: true),
            OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
            StoreCountryId = table.Column<Guid>(type: "uuid", nullable: false),
            StoreId = table.Column<string>(type: "varchar(50)", nullable: false),
            StoreItemCategories = table.Column<string>(type: "text", nullable: true),
            AgeFrom = table.Column<int>(type: "integer", nullable: true),
            AgeTo = table.Column<int>(type: "integer", nullable: true),
            GenderId = table.Column<Guid>(type: "uuid", nullable: true),
            OpportunityOption = table.Column<string>(type: "varchar(10)", nullable: true),
            StatusId = table.Column<Guid>(type: "uuid", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_StoreAccessControlRule", x => x.Id);
            table.ForeignKey(
                      name: "FK_StoreAccessControlRule_Country_StoreCountryId",
                      column: x => x.StoreCountryId,
                      principalSchema: "Lookup",
                      principalTable: "Country",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_StoreAccessControlRule_Gender_GenderId",
                      column: x => x.GenderId,
                      principalSchema: "Lookup",
                      principalTable: "Gender",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_StoreAccessControlRule_Organization_OrganizationId",
                      column: x => x.OrganizationId,
                      principalSchema: "Entity",
                      principalTable: "Organization",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_StoreAccessControlRule_StoreAccessControlRuleStatus_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "Marketplace",
                      principalTable: "StoreAccessControlRuleStatus",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "StoreAccessControlRuleOpportunity",
          schema: "Marketplace",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            StoreAccessControlRuleId = table.Column<Guid>(type: "uuid", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uuid", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_StoreAccessControlRuleOpportunity", x => x.Id);
            table.ForeignKey(
                      name: "FK_StoreAccessControlRuleOpportunity_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "Opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_StoreAccessControlRuleOpportunity_StoreAccessControlRule_St~",
                      column: x => x.StoreAccessControlRuleId,
                      principalSchema: "Marketplace",
                      principalTable: "StoreAccessControlRule",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_User_FirstName_Surname_EmailConfirmed_PhoneNumber_DateOfBir~",
          schema: "Entity",
          table: "User",
          columns: ["FirstName", "Surname", "EmailConfirmed", "PhoneNumber", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRule_GenderId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "GenderId");

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRule_Name_OrganizationId_StoreId_StatusId~",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          columns: ["Name", "OrganizationId", "StoreId", "StatusId", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRule_OrganizationId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "OrganizationId");

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRule_StatusId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRule_StoreCountryId",
          schema: "Marketplace",
          table: "StoreAccessControlRule",
          column: "StoreCountryId");

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRuleOpportunity_OpportunityId",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity",
          column: "OpportunityId");

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRuleOpportunity_StoreAccessControlRuleId_~",
          schema: "Marketplace",
          table: "StoreAccessControlRuleOpportunity",
          columns: ["StoreAccessControlRuleId", "OpportunityId"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_StoreAccessControlRuleStatus_Name",
          schema: "Marketplace",
          table: "StoreAccessControlRuleStatus",
          column: "Name",
          unique: true);

      ApplicationDb_Store_AccessControl_Rules_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "StoreAccessControlRuleOpportunity",
          schema: "Marketplace");

      migrationBuilder.DropTable(
          name: "StoreAccessControlRule",
          schema: "Marketplace");

      migrationBuilder.DropTable(
          name: "StoreAccessControlRuleStatus",
          schema: "Marketplace");

      migrationBuilder.DropIndex(
          name: "IX_User_FirstName_Surname_EmailConfirmed_PhoneNumber_DateOfBir~",
          schema: "Entity",
          table: "User");

      migrationBuilder.CreateIndex(
          name: "IX_User_FirstName_Surname_EmailConfirmed_PhoneNumber_ExternalI~",
          schema: "Entity",
          table: "User",
          columns: ["FirstName", "Surname", "EmailConfirmed", "PhoneNumber", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified"]);
    }
  }
}
