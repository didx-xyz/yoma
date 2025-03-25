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

    public bool CompletedVerificationsOnly { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; } = false;
  }
}
