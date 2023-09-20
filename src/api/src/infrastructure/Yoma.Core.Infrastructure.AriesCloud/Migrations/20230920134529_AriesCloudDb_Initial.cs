using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.AriesCloud.Migrations
{
    /// <inheritdoc />
    public partial class AriesCloudDb_Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "ariescloud");

            migrationBuilder.CreateTable(
                name: "InvitationCache",
                schema: "ariescloud",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceTenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetTenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvitationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvitationPayload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "varchar(50)", nullable: false),
                    Status = table.Column<string>(type: "varchar(50)", nullable: false),
                    ThreadId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DateStamp = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvitationCache", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InvitationCache_SourceTenantId_TargetTenantId_InvitationId_Type_Status_ThreadId",
                schema: "ariescloud",
                table: "InvitationCache",
                columns: new[] { "SourceTenantId", "TargetTenantId", "InvitationId", "Type", "Status", "ThreadId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvitationCache",
                schema: "ariescloud");
        }
    }
}
