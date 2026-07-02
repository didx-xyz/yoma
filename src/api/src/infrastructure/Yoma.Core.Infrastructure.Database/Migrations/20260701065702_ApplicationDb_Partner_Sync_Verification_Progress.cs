using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_Verification_Progress : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<Guid>(
          name: "MyOpportunityId",
          schema: "PartnerSync",
          table: "ProcessingLog",
          type: "uuid",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "PercentComplete",
          schema: "Opportunity",
          table: "MyOpportunity",
          type: "numeric(5,2)",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_ProcessingLog_MyOpportunityId",
          schema: "PartnerSync",
          table: "ProcessingLog",
          column: "MyOpportunityId");

      migrationBuilder.CreateIndex(
          name: "IX_ProcessingLog_SyncType_EntityType_MyOpportunityId_StatusId_~",
          schema: "PartnerSync",
          table: "ProcessingLog",
          columns: ["SyncType", "EntityType", "MyOpportunityId", "StatusId", "DateModified"]);

      migrationBuilder.AddForeignKey(
          name: "FK_ProcessingLog_MyOpportunity_MyOpportunityId",
          schema: "PartnerSync",
          table: "ProcessingLog",
          column: "MyOpportunityId",
          principalSchema: "Opportunity",
          principalTable: "MyOpportunity",
          principalColumn: "Id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_ProcessingLog_MyOpportunity_MyOpportunityId",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropIndex(
          name: "IX_ProcessingLog_MyOpportunityId",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropIndex(
          name: "IX_ProcessingLog_SyncType_EntityType_MyOpportunityId_StatusId_~",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropColumn(
          name: "MyOpportunityId",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropColumn(
          name: "PercentComplete",
          schema: "Opportunity",
          table: "MyOpportunity");
    }
  }
}
