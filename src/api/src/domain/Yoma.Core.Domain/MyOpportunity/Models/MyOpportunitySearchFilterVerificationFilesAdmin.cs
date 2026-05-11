using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public sealed class MyOpportunitySearchFilterVerificationFilesAdmin : PaginationFilter, IHashableObject
  {
    public Guid Opportunity { get; set; }

    public List<VerificationType>? VerificationTypes { get; set; }

    public Guid? UserId { get; set; }

    public bool CompletedVerificationsOnly { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; } = false;

    public void NormalizeForHashing()
    {
      VerificationTypes = VerificationTypes?.OrderBy(o => o).ToList();
    }

    public void SanitizeCollections()
    {
      VerificationTypes = VerificationTypes?.Distinct().ToList();
      if (VerificationTypes?.Count == 0) VerificationTypes = null;
    }
  }
}
