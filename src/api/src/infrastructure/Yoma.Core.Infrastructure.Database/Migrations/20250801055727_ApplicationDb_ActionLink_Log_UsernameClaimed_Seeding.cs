using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_ActionLink_Log_UsernameClaimed_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(@"
        UPDATE ""ActionLink"".""UsageLog"" ul
        SET ""UsernameClaimed"" = COALESCE(u.""Email"", u.""PhoneNumber"")
        FROM ""Entity"".""User"" u
        WHERE ul.""UserId"" = u.""Id""
        AND ul.""UsernameClaimed"" IS NULL;");
    }
  }
}
