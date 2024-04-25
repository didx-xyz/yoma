using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_ActionLink : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "ShortURL",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.EnsureSchema(
          name: "ActionLink");

      migrationBuilder.CreateTable(
          name: "Status",
          schema: "ActionLink",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Status", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Link",
          schema: "ActionLink",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(255)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: true),
            EntityType = table.Column<string>(type: "varchar(25)", nullable: false),
            Action = table.Column<string>(type: "varchar(25)", nullable: false),
            StatusId = table.Column<Guid>(type: "uuid", nullable: false),
            OpportunityId = table.Column<Guid>(type: "uuid", nullable: true),
            URL = table.Column<string>(type: "varchar(2048)", nullable: false),
            ShortURL = table.Column<string>(type: "varchar(2048)", nullable: false),
            UsagesLimit = table.Column<int>(type: "integer", nullable: true),
            UsagesTotal = table.Column<int>(type: "integer", nullable: true),
            DateEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            ModifiedByUserId = table.Column<Guid>(type: "uuid", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Link", x => x.Id);
            table.ForeignKey(
                      name: "FK_Link_Opportunity_OpportunityId",
                      column: x => x.OpportunityId,
                      principalSchema: "Opportunity",
                      principalTable: "Opportunity",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Link_Status_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "ActionLink",
                      principalTable: "Status",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Link_User_CreatedByUserId",
                      column: x => x.CreatedByUserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Link_User_ModifiedByUserId",
                      column: x => x.ModifiedByUserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "UsageLog",
          schema: "ActionLink",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            LinkId = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_UsageLog", x => x.Id);
            table.ForeignKey(
                      name: "FK_UsageLog_Link_LinkId",
                      column: x => x.LinkId,
                      principalSchema: "ActionLink",
                      principalTable: "Link",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_UsageLog_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_Link_CreatedByUserId",
          schema: "ActionLink",
          table: "Link",
          column: "CreatedByUserId");

      migrationBuilder.CreateIndex(
          name: "IX_Link_EntityType_Action_StatusId_OpportunityId_DateEnd_DateC~",
          schema: "ActionLink",
          table: "Link",
          columns: ["EntityType", "Action", "StatusId", "OpportunityId", "DateEnd", "DateCreated"]);

      migrationBuilder.CreateIndex(
          name: "IX_Link_ModifiedByUserId",
          schema: "ActionLink",
          table: "Link",
          column: "ModifiedByUserId");

      migrationBuilder.CreateIndex(
          name: "IX_Link_OpportunityId",
          schema: "ActionLink",
          table: "Link",
          column: "OpportunityId");

      migrationBuilder.CreateIndex(
          name: "IX_Link_ShortURL",
          schema: "ActionLink",
          table: "Link",
          column: "ShortURL",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Link_StatusId",
          schema: "ActionLink",
          table: "Link",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_Link_URL",
          schema: "ActionLink",
          table: "Link",
          column: "URL",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Status_Name",
          schema: "ActionLink",
          table: "Status",
          column: "Name",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_UsageLog_DateCreated",
          schema: "ActionLink",
          table: "UsageLog",
          column: "DateCreated");

      migrationBuilder.CreateIndex(
          name: "IX_UsageLog_LinkId_UserId",
          schema: "ActionLink",
          table: "UsageLog",
          columns: ["LinkId", "UserId"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_UsageLog_UserId",
          schema: "ActionLink",
          table: "UsageLog",
          column: "UserId");

      ApplicationDb_ActionLink_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "UsageLog",
          schema: "ActionLink");

      migrationBuilder.DropTable(
          name: "Link",
          schema: "ActionLink");

      migrationBuilder.DropTable(
          name: "Status",
          schema: "ActionLink");

      migrationBuilder.AddColumn<string>(
          name: "ShortURL",
          schema: "Opportunity",
          table: "Opportunity",
          type: "varchar(2048)",
          nullable: true);
    }
  }
}
