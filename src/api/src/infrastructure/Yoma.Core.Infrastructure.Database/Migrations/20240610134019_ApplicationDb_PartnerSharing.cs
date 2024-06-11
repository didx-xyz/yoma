using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_PartnerSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "PartnerSharing");

            migrationBuilder.CreateTable(
                name: "Partner",
                schema: "PartnerSharing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "varchar(20)", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    ActionStatus = table.Column<string>(type: "text", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partner", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Status",
                schema: "PartnerSharing",
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
                name: "ProcessingLog",
                schema: "PartnerSharing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityType = table.Column<string>(type: "varchar(25)", nullable: false),
                    OpportunityId = table.Column<Guid>(type: "uuid", nullable: true),
                    PartnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "varchar(25)", nullable: false),
                    StatusId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityExternalId = table.Column<string>(type: "varchar(50)", nullable: true),
                    ErrorReason = table.Column<string>(type: "text", nullable: true),
                    RetryCount = table.Column<byte>(type: "smallint", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessingLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessingLog_Opportunity_OpportunityId",
                        column: x => x.OpportunityId,
                        principalSchema: "Opportunity",
                        principalTable: "Opportunity",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProcessingLog_Partner_PartnerId",
                        column: x => x.PartnerId,
                        principalSchema: "PartnerSharing",
                        principalTable: "Partner",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessingLog_Status_StatusId",
                        column: x => x.StatusId,
                        principalSchema: "PartnerSharing",
                        principalTable: "Status",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Partner_Name",
                schema: "PartnerSharing",
                table: "Partner",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingLog_EntityType_OpportunityId_PartnerId_Action_Sta~",
                schema: "PartnerSharing",
                table: "ProcessingLog",
                columns: ["EntityType", "OpportunityId", "PartnerId", "Action", "StatusId", "EntityExternalId", "DateCreated", "DateModified"]);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingLog_OpportunityId",
                schema: "PartnerSharing",
                table: "ProcessingLog",
                column: "OpportunityId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingLog_PartnerId",
                schema: "PartnerSharing",
                table: "ProcessingLog",
                column: "PartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingLog_StatusId",
                schema: "PartnerSharing",
                table: "ProcessingLog",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Status_Name1",
                schema: "PartnerSharing",
                table: "Status",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessingLog",
                schema: "PartnerSharing");

            migrationBuilder.DropTable(
                name: "Partner",
                schema: "PartnerSharing");

            migrationBuilder.DropTable(
                name: "Status",
                schema: "PartnerSharing");
        }
    }
}
