using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Referral : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.EnsureSchema(
          name: "Referral");

      migrationBuilder.AddColumn<Guid>(
          name: "ReferralLinkUsageId",
          schema: "Reward",
          table: "Transaction",
          type: "uuid",
          nullable: true);

      migrationBuilder.CreateTable(
          name: "BlockReason",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(50)", nullable: false),
            Description = table.Column<string>(type: "varchar(255)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_BlockReason", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "LinkStatus",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_LinkStatus", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "LinkUsageStatus",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_LinkUsageStatus", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "ProgramStatus",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_ProgramStatus", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Block",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            ReasonId = table.Column<Guid>(type: "uuid", nullable: false),
            CommentBlock = table.Column<string>(type: "varchar(500)", nullable: true),
            CommentUnblock = table.Column<string>(type: "varchar(500)", nullable: true),
            Active = table.Column<bool>(type: "boolean", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            ModifiedByUserId = table.Column<Guid>(type: "uuid", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Block", x => x.Id);
            table.ForeignKey(
                      name: "FK_Block_BlockReason_ReasonId",
                      column: x => x.ReasonId,
                      principalSchema: "Referral",
                      principalTable: "BlockReason",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Block_User_CreatedByUserId",
                      column: x => x.CreatedByUserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Block_User_ModifiedByUserId",
                      column: x => x.ModifiedByUserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Block_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "Program",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: true),
            ImageId = table.Column<Guid>(type: "uuid", nullable: true),
            CompletionWindowInDays = table.Column<int>(type: "integer", nullable: true),
            CompletionLimitReferee = table.Column<int>(type: "integer", nullable: true),
            CompletionLimit = table.Column<int>(type: "integer", nullable: true),
            CompletionTotal = table.Column<int>(type: "integer", nullable: true),
            ZltoRewardReferrer = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
            ZltoRewardReferee = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
            ZltoRewardPool = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ZltoRewardCumulative = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ProofOfPersonhoodRequired = table.Column<bool>(type: "boolean", nullable: false),
            PathwayRequired = table.Column<bool>(type: "boolean", nullable: false),
            MultipleLinksAllowed = table.Column<bool>(type: "boolean", nullable: false),
            StatusId = table.Column<Guid>(type: "uuid", nullable: false),
            IsDefault = table.Column<bool>(type: "boolean", nullable: false),
            DateStart = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            ModifiedByUserId = table.Column<Guid>(type: "uuid", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Program", x => x.Id);
            table.ForeignKey(
                      name: "FK_Program_Blob_ImageId",
                      column: x => x.ImageId,
                      principalSchema: "Object",
                      principalTable: "Blob",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Program_ProgramStatus_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "Referral",
                      principalTable: "ProgramStatus",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Program_User_CreatedByUserId",
                      column: x => x.CreatedByUserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Program_User_ModifiedByUserId",
                      column: x => x.ModifiedByUserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "Link",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: true),
            ProgramId = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            StatusId = table.Column<Guid>(type: "uuid", nullable: false),
            URL = table.Column<string>(type: "varchar(2048)", nullable: false),
            ShortURL = table.Column<string>(type: "varchar(2048)", nullable: false),
            CompletionTotal = table.Column<int>(type: "integer", nullable: true),
            ZltoRewardCumulative = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Link", x => x.Id);
            table.ForeignKey(
                      name: "FK_Link_LinkStatus_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "Referral",
                      principalTable: "LinkStatus",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Link_Program_ProgramId",
                      column: x => x.ProgramId,
                      principalSchema: "Referral",
                      principalTable: "Program",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Link_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "ProgramPathway",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ProgramId = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: true),
            Rule = table.Column<string>(type: "varchar(10)", nullable: false),
            OrderMode = table.Column<string>(type: "varchar(10)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_ProgramPathway", x => x.Id);
            table.ForeignKey(
                      name: "FK_ProgramPathway_Program_ProgramId",
                      column: x => x.ProgramId,
                      principalSchema: "Referral",
                      principalTable: "Program",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "LinkUsage",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ProgramId = table.Column<Guid>(type: "uuid", nullable: false),
            LinkId = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            StatusId = table.Column<Guid>(type: "uuid", nullable: false),
            ZltoRewardReferrer = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
            ZltoRewardReferee = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_LinkUsage", x => x.Id);
            table.ForeignKey(
                      name: "FK_LinkUsage_LinkUsageStatus_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "Referral",
                      principalTable: "LinkUsageStatus",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_LinkUsage_Link_LinkId",
                      column: x => x.LinkId,
                      principalSchema: "Referral",
                      principalTable: "Link",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_LinkUsage_Program_ProgramId",
                      column: x => x.ProgramId,
                      principalSchema: "Referral",
                      principalTable: "Program",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_LinkUsage_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "ProgramPathwayStep",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            PathwayId = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: true),
            Rule = table.Column<string>(type: "varchar(10)", nullable: false),
            OrderMode = table.Column<string>(type: "varchar(10)", nullable: false),
            Order = table.Column<short>(type: "smallint", nullable: true),
            OrderDisplay = table.Column<short>(type: "smallint", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_ProgramPathwayStep", x => x.Id);
            table.ForeignKey(
                      name: "FK_ProgramPathwayStep_ProgramPathway_PathwayId",
                      column: x => x.PathwayId,
                      principalSchema: "Referral",
                      principalTable: "ProgramPathway",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "ProgramPathwayTask",
          schema: "Referral",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            StepId = table.Column<Guid>(type: "uuid", nullable: false),
            EntityType = table.Column<string>(type: "varchar(25)", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uuid", nullable: true),
            Order = table.Column<short>(type: "smallint", nullable: true),
            OrderDisplay = table.Column<short>(type: "smallint", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_ProgramPathwayTask", x => x.Id);
            table.ForeignKey(
                      name: "FK_ProgramPathwayTask_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "Opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_ProgramPathwayTask_ProgramPathwayStep_StepId",
                      column: x => x.StepId,
                      principalSchema: "Referral",
                      principalTable: "ProgramPathwayStep",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_ReferralLinkUsageId",
          schema: "Reward",
          table: "Transaction",
          column: "ReferralLinkUsageId");

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction",
          columns: new[] { "UserId", "SourceEntityType", "MyOpportunityId", "ReferralLinkUsageId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Block_CreatedByUserId",
          schema: "Referral",
          table: "Block",
          column: "CreatedByUserId");

      migrationBuilder.CreateIndex(
          name: "IX_Block_ModifiedByUserId",
          schema: "Referral",
          table: "Block",
          column: "ModifiedByUserId");

      migrationBuilder.CreateIndex(
          name: "IX_Block_ReasonId_DateCreated_DateModified",
          schema: "Referral",
          table: "Block",
          columns: new[] { "ReasonId", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_Block_UserId",
          schema: "Referral",
          table: "Block",
          column: "UserId",
          unique: true,
          filter: "\"Active\" = true");

      migrationBuilder.CreateIndex(
          name: "IX_BlockReason_Name",
          schema: "Referral",
          table: "BlockReason",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Link_Name_ProgramId_UserId",
          schema: "Referral",
          table: "Link",
          columns: new[] { "Name", "ProgramId", "UserId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Link_ProgramId",
          schema: "Referral",
          table: "Link",
          column: "ProgramId");

      migrationBuilder.CreateIndex(
          name: "IX_Link_ShortURL1",
          schema: "Referral",
          table: "Link",
          column: "ShortURL",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Link_StatusId1",
          schema: "Referral",
          table: "Link",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_Link_URL1",
          schema: "Referral",
          table: "Link",
          column: "URL",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Link_UserId_ProgramId_StatusId_DateCreated_DateModified",
          schema: "Referral",
          table: "Link",
          columns: new[] { "UserId", "ProgramId", "StatusId", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_LinkStatus_Name",
          schema: "Referral",
          table: "LinkStatus",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_LinkUsage_LinkId_StatusId_DateCreated_DateModified",
          schema: "Referral",
          table: "LinkUsage",
          columns: new[] { "LinkId", "StatusId", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_LinkUsage_ProgramId",
          schema: "Referral",
          table: "LinkUsage",
          column: "ProgramId");

      migrationBuilder.CreateIndex(
          name: "IX_LinkUsage_StatusId",
          schema: "Referral",
          table: "LinkUsage",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_LinkUsage_UserId_ProgramId",
          schema: "Referral",
          table: "LinkUsage",
          columns: new[] { "UserId", "ProgramId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_LinkUsageStatus_Name",
          schema: "Referral",
          table: "LinkUsageStatus",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Program_CreatedByUserId",
          schema: "Referral",
          table: "Program",
          column: "CreatedByUserId");

      migrationBuilder.CreateIndex(
          name: "IX_Program_Description_StatusId_IsDefault_DateStart_DateEnd_Da~",
          schema: "Referral",
          table: "Program",
          columns: new[] { "Description", "StatusId", "IsDefault", "DateStart", "DateEnd", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_Program_ImageId",
          schema: "Referral",
          table: "Program",
          column: "ImageId");

      migrationBuilder.CreateIndex(
          name: "IX_Program_IsDefault",
          schema: "Referral",
          table: "Program",
          column: "IsDefault",
          unique: true,
          filter: "\"IsDefault\" = true");

      migrationBuilder.CreateIndex(
          name: "IX_Program_ModifiedByUserId",
          schema: "Referral",
          table: "Program",
          column: "ModifiedByUserId");

      migrationBuilder.CreateIndex(
          name: "IX_Program_Name",
          schema: "Referral",
          table: "Program",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Program_StatusId",
          schema: "Referral",
          table: "Program",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathway_ProgramId",
          schema: "Referral",
          table: "ProgramPathway",
          column: "ProgramId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathway_ProgramId_DateCreated_DateModified",
          schema: "Referral",
          table: "ProgramPathway",
          columns: new[] { "ProgramId", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathway_ProgramId_Name",
          schema: "Referral",
          table: "ProgramPathway",
          columns: new[] { "ProgramId", "Name" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathwayStep_PathwayId_Name",
          schema: "Referral",
          table: "ProgramPathwayStep",
          columns: new[] { "PathwayId", "Name" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathwayStep_PathwayId_Order_OrderDisplay_DateCreated~",
          schema: "Referral",
          table: "ProgramPathwayStep",
          columns: new[] { "PathwayId", "Order", "OrderDisplay", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathwayTask_OpportunityId",
          schema: "Referral",
          table: "ProgramPathwayTask",
          column: "OpportunityId");

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathwayTask_StepId_EntityType_OpportunityId",
          schema: "Referral",
          table: "ProgramPathwayTask",
          columns: new[] { "StepId", "EntityType", "OpportunityId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_ProgramPathwayTask_StepId_Order_OrderDisplay_DateCreated_Da~",
          schema: "Referral",
          table: "ProgramPathwayTask",
          columns: new[] { "StepId", "Order", "OrderDisplay", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_ProgramStatus_Name",
          schema: "Referral",
          table: "ProgramStatus",
          column: "Name",
          unique: true);

      migrationBuilder.AddForeignKey(
          name: "FK_Transaction_LinkUsage_ReferralLinkUsageId",
          schema: "Reward",
          table: "Transaction",
          column: "ReferralLinkUsageId",
          principalSchema: "Referral",
          principalTable: "LinkUsage",
          principalColumn: "Id");

      ApplicationDb_Referral_Seeding.Seed(migrationBuilder);  
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Transaction_LinkUsage_ReferralLinkUsageId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropTable(
          name: "Block",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "LinkUsage",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "ProgramPathwayTask",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "BlockReason",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "LinkUsageStatus",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "Link",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "ProgramPathwayStep",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "LinkStatus",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "ProgramPathway",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "Program",
          schema: "Referral");

      migrationBuilder.DropTable(
          name: "ProgramStatus",
          schema: "Referral");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_ReferralLinkUsageId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropColumn(
          name: "ReferralLinkUsageId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId",
          schema: "Reward",
          table: "Transaction",
          columns: new[] { "UserId", "SourceEntityType", "MyOpportunityId" },
          unique: true);
    }
  }
}
