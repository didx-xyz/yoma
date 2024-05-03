using Newtonsoft.Json;

namespace Yoma.Core.Domain.ActionLink.Models
{
  public abstract class LinkRequestCreateBase
  {
    public string? Name { get; set; }

    public string? Description { get; set; }

    public LinkEntityType EntityType { get; set; }

    public Guid EntityId { get; set; }

    public bool? IncludeQRCode { get; set; }

    [JsonIgnore]
    internal virtual LinkAction Action { get; set; }
  }
}
