using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity.Extensions;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityItem
  {
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string OrganizationName { get; set; } = null!;

    [JsonIgnore]
    public Guid? OrganizationLogoId { get; set; }

    [JsonIgnore]
    public StorageType? OrganizationLogoStorageType { get; set; }

    [JsonIgnore]
    public string? OrganizationLogoKey { get; set; }

    /// <summary>
    /// Optional. Resolved when needed (expensive operation) 
    /// </summary>
    public string? OrganizationLogoURL { get; set; }

    [JsonIgnore]
    public OrganizationStatus OrganizationStatus { get; set; }

    [JsonIgnore]
    public bool VerificationEnabled { get; set; }

    [JsonIgnore]
    public VerificationMethod? VerificationMethod { get; set; }

    [JsonIgnore]
    public Status Status { get; set; }

    [JsonIgnore]
    public bool? Hidden { get; set; }

    [JsonIgnore]
    public DateTimeOffset DateStart { get; set; }

    [JsonIgnore]
    public string Type { get; set; } = null!;

    [JsonIgnore]
    public bool IsCompletable
    {
      get
      {
        var result = this.Completable(out var reason);
        NonCompletableReason = reason;
        return result;
      }
    }

    [JsonIgnore]
    public string? NonCompletableReason { get; private set; }

    [JsonIgnore]
    public List<Country>? Countries { get; set; }
  }
}
