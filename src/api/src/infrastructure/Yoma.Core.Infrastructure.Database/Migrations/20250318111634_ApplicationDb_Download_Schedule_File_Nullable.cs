using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Download_Schedule_File_Nullable : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Schedule_UserId_Type_FilterHash_StatusId_DateCreated_DateMo~",
          schema: "Download",
          table: "Schedule");

      migrationBuilder.CreateIndex(
          name: "IX_Schedule_UserId_Type_FilterHash_StatusId_FileId_DateCreated~",
          schema: "Download",
          table: "Schedule",
          columns: new[] { "UserId", "Type", "FilterHash", "StatusId", "FileId", "DateCreated", "DateModified" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Schedule_UserId_Type_FilterHash_StatusId_FileId_DateCreated~",
          schema: "Download",
          table: "Schedule");

      migrationBuilder.CreateIndex(
          name: "IX_Schedule_UserId_Type_FilterHash_StatusId_DateCreated_DateMo~",
          schema: "Download",
          table: "Schedule",
          columns: new[] { "UserId", "Type", "FilterHash", "StatusId", "DateCreated", "DateModified" });
    }
  }
}
