namespace Yoma.Core.Domain.ShortLinkProvider.Models
{
  public class ShortLinkRequest
  {
    public EntityType Type { get; set; }

    public Action Action { get; set; }

    public string Title { get; set; }

    public string URL { get; set; }

    public List<string>? ExtraTags { get; set; }
  }
}
