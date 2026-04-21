using Newtonsoft.Json;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  public sealed class SyncItemOpportunity
  {
    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public Guid? OrganizationId { get; set; }

    public string? Summary { get; set; }

    public string? URL { get; set; }

    public string ExternalId { get; set; } = null!;

    public List<string> CountriesCodeAlpha2 { get; set; } = null!;

    [JsonIgnore]
    internal List<Guid>? Countries { get; set; }

    public bool? Deleted { get; set; }
  }
}
