using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_ActionLink_Approval : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
          name: "CommentApproval",
          schema: "ActionLink",
          table: "Link",
          type: "varchar(500)",
          nullable: true);

      ApplicationDb_ActionLink_Approval_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "CommentApproval",
          schema: "ActionLink",
          table: "Link");
    }
  }
}
