using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunitySearchFilterVerificationFilesAdmin : PaginationFilter
  {
    public Guid Opportunity { get; set; }

    public List<VerificationType>? VerificationTypes { get; set; }

    public Guid? UserId { get; set; }

    /// <summary>
    /// Internal flag used by scheduled admin downloads to determine whether only completed verifications should be included.
    /// Defaults to <c>false</c>.
    /// </summary>
    [JsonIgnore]
    internal bool CompletedVerificationsOnly { get; set; } = false;

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; } = false;
  }
}
