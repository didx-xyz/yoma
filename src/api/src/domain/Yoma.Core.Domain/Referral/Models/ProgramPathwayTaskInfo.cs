using Newtonsoft.Json;

namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayTaskInfo
  {
    public Guid Id { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Opportunity.Models.OpportunityItem? Opportunity { get; set; }

    public short? Order { get; set; }

    public short OrderDisplay { get; set; }

    public bool IsCompletable { get; set; }


    public string? NonCompletableReason { get; set; }

    [JsonIgnore]
    public List<Domain.Lookups.Models.Country>? ProgramCountries { get; set; }
  }
}
