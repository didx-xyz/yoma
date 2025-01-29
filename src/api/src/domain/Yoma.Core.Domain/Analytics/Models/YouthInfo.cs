using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class YouthInfo
  {
    public Guid Id { get; set; }

    public string DisplayName { get; set; }

    public string? Country { get; set; }

    public int? Age { get; set; }

    public decimal ZltoRewardTotal { get; set; }

    public decimal YomaRewardTotal { get; set; }

    public int OpporunityCount { get; set; }

    public List<YouthInfoOpportunity> Opportunities { get; set; }
  }

  public class YouthInfoOpportunity
  {
    public Guid Id { get; set; }

    public string Title { get; set; }

    public Status Status { get; set; }

    public Guid? OrganizationLogoId { get; set; }

    [JsonIgnore]
    public StorageType? OrganizationLogoStorageType { get; set; }

    [JsonIgnore]
    public string? OrganizationLogoKey { get; set; }

    public string? OrganizationLogoURL { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public bool Verified { get; set; }
  }
}
