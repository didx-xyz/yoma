using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Download_Schedule : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.EnsureSchema(
          name: "Download");

      migrationBuilder.CreateTable(
          name: "ScheduleStatus",
          schema: "Download",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(30)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_ScheduleStatus", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Schedule",
          schema: "Download",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            Type = table.Column<string>(type: "varchar(50)", nullable: false),
            Filter = table.Column<string>(type: "text", nullable: false),
            FilterHash = table.Column<string>(type: "varchar(64)", nullable: false),
            StatusId = table.Column<Guid>(type: "uuid", nullable: false),
            FileId = table.Column<Guid>(type: "uuid", nullable: true),
            ErrorReason = table.Column<string>(type: "text", nullable: true),
            RetryCount = table.Column<byte>(type: "smallint", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Schedule", x => x.Id);
            table.ForeignKey(
                      name: "FK_Schedule_Blob_FileId",
                      column: x => x.FileId,
                      principalSchema: "Object",
                      principalTable: "Blob",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Schedule_ScheduleStatus_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "Download",
                      principalTable: "ScheduleStatus",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Schedule_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_Schedule_FileId",
          schema: "Download",
          table: "Schedule",
          column: "FileId");

      migrationBuilder.CreateIndex(
          name: "IX_Schedule_StatusId",
          schema: "Download",
          table: "Schedule",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_Schedule_UserId_Type_FilterHash_StatusId_DateCreated_DateMo~",
          schema: "Download",
          table: "Schedule",
          columns: new[] { "UserId", "Type", "FilterHash", "StatusId", "DateCreated", "DateModified" });

      migrationBuilder.CreateIndex(
          name: "IX_ScheduleStatus_Name",
          schema: "Download",
          table: "ScheduleStatus",
          column: "Name",
          unique: true);

      ApplicationDb_Download_Schedule_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "Schedule",
          schema: "Download");

      migrationBuilder.DropTable(
          name: "ScheduleStatus",
          schema: "Download");
    }
  }
}
