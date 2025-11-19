using Newtonsoft.Json;
using Yoma.Core.Domain.Entity;

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
    public Status Status { get; set; }

    [JsonIgnore]
    public DateTimeOffset DateStart { get; set; }

    [JsonIgnore]
    public bool IsCompletable { get; set; }

    [JsonIgnore]
    public string? NonCompletableReason { get; set; }
  }
}
