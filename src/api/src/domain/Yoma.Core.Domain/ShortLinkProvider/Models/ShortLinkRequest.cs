using Yoma.Core.Domain.ActionLink;

namespace Yoma.Core.Domain.ShortLinkProvider.Models
{
  public class ShortLinkRequest
  {
    public LinkEntityType Type { get; set; }

    public LinkAction Action { get; set; }

    public string Title { get; set; } = null!;

    public string URL { get; set; } = null!;

    public List<string>? ExtraTags { get; set; }
  }
}
