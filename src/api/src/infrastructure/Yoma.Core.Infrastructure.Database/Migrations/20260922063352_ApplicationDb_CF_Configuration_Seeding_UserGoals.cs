using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_UserGoals
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Entity
      migrationBuilder.InsertData(
        schema: "Entity",
        table: "UserGoal",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          { new Guid("007b6270-6feb-4013-ad7b-86d241ffb870"), "Get a job", DateTimeOffset.UtcNow },
          { new Guid("d3e89d6e-0b5b-4b7b-8634-a95d79b4bcd1"), "Learn new skills", DateTimeOffset.UtcNow },
          { new Guid("1e475ab9-dbd0-4ce3-9eee-b84bf1b978ac"), "Start a business", DateTimeOffset.UtcNow },
          { new Guid("830eacf5-86e9-4d31-869b-119d5f951fc8"), "Volunteer / make an impact", DateTimeOffset.UtcNow },
          { new Guid("d26bb533-226f-4138-91b8-c6a48592f739"), "Attend events", DateTimeOffset.UtcNow }
        });
      #endregion Entity
    }
  }
}
