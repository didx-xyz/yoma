using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class ApplicationDb_ActionLink_DistributionList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DistributionList",
                schema: "ActionLink",
                table: "Link",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LockToDistributionList",
                schema: "ActionLink",
                table: "Link",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DistributionList",
                schema: "ActionLink",
                table: "Link");

            migrationBuilder.DropColumn(
                name: "LockToDistributionList",
                schema: "ActionLink",
                table: "Link");
        }
    }
}
