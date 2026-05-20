using Newtonsoft.Json;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.PartnerSync.Models.Lookups
{
  public class Partner
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public bool Active { get; set; }

    /// <summary>
    /// Defines the partner sync capabilities as sync type -> entity type -> supported sync scopes.
    /// The entity type and sync scope are supplied by the partner sync configuration / processing context
    /// and are therefore not repeated on filters, requests, or sync items.
    /// </summary>
    [JsonIgnore]
    public string SyncCapabilities { get; set; } = null!;

    public Dictionary<SyncType, Dictionary<EntityType, List<SyncScope>>> SyncCapabilitiesParsed { get; set; } = null!;

    [JsonIgnore]
    public string? ActionsEnabled { get; set; }

    public List<SyncAction> ActionsEnabledParsed { get; set; } = null!; //defaults to true for all actions if not explicitly defined (see ActionsEnabled)
  }
}
