using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_Accessibility
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Lookups
      migrationBuilder.InsertData(
        schema: "Lookup",
        table: "Accessibility",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef01"), "Wheelchair accessible", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef02"), "Step-free access", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef03"), "Accessible parking", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef04"), "Accessible restrooms", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef05"), "Elevator access", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef06"), "Flexible hours", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef07"), "Screen reader compatible software", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef08"), "Keyboard accessible systems", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef09"), "Closed captions", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef0a"), "Sign language interpretation", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef0b"), "Alternative interview formats", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef0c"), "Alternative learning materials", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef0d"), "Quiet workspace", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef0e"), "Ergonomic workstation", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef0f"), "Service animals permitted", DateTimeOffset.UtcNow },
          { new Guid("b8dd2526-c252-48a3-a7c8-3df79298ef10"), "Other", DateTimeOffset.UtcNow }
        });
      #endregion Lookups
    }
  }
}
