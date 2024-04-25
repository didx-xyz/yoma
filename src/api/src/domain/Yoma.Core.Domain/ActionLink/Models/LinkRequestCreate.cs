namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkRequestCreate
  {
    public string Name { get; set; }

    public string? Description { get; set; }

    public LinkEntityType EntityType { get; set; }

    public LinkAction Action { get; set; }

    public Guid EntityId { get; set; }

    public string URL { get; set; }

    public int? UsagesLimit { get; set; }

    public DateTimeOffset? DateEnd { get; set; }
  }
}
