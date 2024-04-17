namespace Yoma.Core.Domain.ShortLinkProvider.Models
{
  public class ShortLinkRequest
  {
    public ShortLinkType Type { get; set; }

    public string Title { get; set; }

    public string URL { get; set; }

    public List<string>? Tags { get; set; }
  }
}
