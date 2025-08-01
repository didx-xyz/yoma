using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class ApplicationDb_ActionLink_Log_UsernameClaimed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UsageLog_DateCreated",
                schema: "ActionLink",
                table: "UsageLog");

            migrationBuilder.AddColumn<string>(
                name: "UsernameClaimed",
                schema: "ActionLink",
                table: "UsageLog",
                type: "varchar(320)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsageLog_UsernameClaimed_DateCreated",
                schema: "ActionLink",
                table: "UsageLog",
                columns: new[] { "UsernameClaimed", "DateCreated" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UsageLog_UsernameClaimed_DateCreated",
                schema: "ActionLink",
                table: "UsageLog");

            migrationBuilder.DropColumn(
                name: "UsernameClaimed",
                schema: "ActionLink",
                table: "UsageLog");

            migrationBuilder.CreateIndex(
                name: "IX_UsageLog_DateCreated",
                schema: "ActionLink",
                table: "UsageLog",
                column: "DateCreated");
        }
    }
}
