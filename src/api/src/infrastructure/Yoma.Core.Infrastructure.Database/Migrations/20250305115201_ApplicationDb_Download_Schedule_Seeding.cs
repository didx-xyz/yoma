using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Download_Schedule_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Core
      #region Lookups
      migrationBuilder.InsertData(
      table: "ScheduleStatus",
      columns: ["Id", "Name", "DateCreated"],
      values: new object?[,]
      {
        {"6F0A6C93-1A08-4848-A84B-5194618AF141","Pending",DateTimeOffset.UtcNow}
        ,
        {"7FAEB152-C3D3-4B2A-BF6D-52D966221AE3","Processed",DateTimeOffset.UtcNow}
        ,
        {"9C011216-7F94-4A21-99D9-6C767E418A03","Error",DateTimeOffset.UtcNow}
        ,
        {"E18CBA67-22CA-4FEC-B0DD-7D9B2FB3C29F","Deleted",DateTimeOffset.UtcNow}
      },
      schema: "Download");
      #endregion Lookups
      #endregion Core
    }
  }
}
