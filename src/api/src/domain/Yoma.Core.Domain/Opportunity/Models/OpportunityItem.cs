using Newtonsoft.Json;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Opportunity.Extensions;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityItem
  {
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

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
  }
}
