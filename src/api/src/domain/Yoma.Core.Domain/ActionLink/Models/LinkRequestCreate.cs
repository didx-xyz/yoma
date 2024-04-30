using Newtonsoft.Json;

namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkRequestCreate
  {
    public string? Name { get; set; }

    public string? Description { get; set; }

    public LinkEntityType EntityType { get; set; }

    [JsonIgnore]
    public LinkAction Action { get; set; } = LinkAction.Verify;

    public Guid EntityId { get; set; }

    public int? UsagesLimit { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public List<string>? DistributionList { get; set; }

    public bool? IncludeQRCode { get; set; }
  }
}
