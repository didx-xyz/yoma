namespace Yoma.Core.Infrastructure.Substack.Models
{
  public class NewsArticleRaw
  {
    public string ExternalId { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string URL { get; set; } = null!;

    public string? ThumbnailURL { get; set; }

    public DateTimeOffset PublishedDate { get; set; }
  }
}
