using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  public sealed class OpportunityUpdatePayload : IHashableObject
  {
    public int ExternalId { get; set; }

    [JsonIgnore]
    public bool UpsertRequired => UpsertRequest != null;

    public OpportunitySkillingUpsertRequest? UpsertRequest { get; set; }

    [JsonIgnore]
    public bool ActionRequired => Action.HasValue;

    public StatusAction? Action { get; set; }

    public OpportunityActionRequest? ActionRequest { get; set; }

    public void NormalizeForHashing()
    {
      // No collection normalization required.
    }
  }
}
