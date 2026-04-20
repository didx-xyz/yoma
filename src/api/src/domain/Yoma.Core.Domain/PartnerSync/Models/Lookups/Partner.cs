using Newtonsoft.Json;

namespace Yoma.Core.Domain.PartnerSync.Models.Lookups
{
  public class Partner
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public bool Active { get; set; }

    [JsonIgnore]
    public string SyncTypesEnabled { get; set; } = null!; //required

    public Dictionary<SyncType, List<EntityType>> SyncTypesEnabledParsed { get; set; } = null!;

    [JsonIgnore]
    public string? ActionEnabled { get; set; }

    public List<SyncAction> ActionEnabledParsed { get; set; } = null!; //defaults to true for all actions if not explicitly defined (see ActionEnabled)
  }
}
