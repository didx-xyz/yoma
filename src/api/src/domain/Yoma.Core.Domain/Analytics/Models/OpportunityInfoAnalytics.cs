using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OpportunityInfoAnalytics
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

    public int ViewedCount { get; set; }

    public int CompletedCount { get; set; }

    public decimal ConversionRatioPercentage { get; set; }
  }
}
