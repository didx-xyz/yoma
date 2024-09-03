using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Organization_Reward_Pools_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(@"
                WITH rewardsums AS (
                    SELECT 
                        o2.""Id"" AS organizationid,
                        CASE 
                            WHEN COUNT(o.""ZltoRewardCumulative"") = 0 THEN NULL
                            ELSE SUM(o.""ZltoRewardCumulative"")
                        END AS zltorewardcumulative,
                        CASE 
                            WHEN COUNT(o.""YomaRewardCumulative"") = 0 THEN NULL
                            ELSE SUM(o.""YomaRewardCumulative"")
                        END AS yomaRewardcumulative
                    FROM 
                        ""Opportunity"".""Opportunity"" o
                    INNER JOIN 
                        ""Entity"".""Organization"" o2 
                    ON 
                        o.""OrganizationId"" = o2.""Id""
                    GROUP BY 
                        o2.""Id""
                )
                UPDATE 
                    ""Entity"".""Organization"" org
                SET 
                    ""ZltoRewardCumulative"" = rewardsums.zltorewardcumulative,
                    ""YomaRewardCumulative"" = rewardsums.yomarewardcumulative
                FROM 
                    rewardsums
                WHERE 
                    org.""Id"" = rewardsums.organizationid;
            ");
    }
  }
}
