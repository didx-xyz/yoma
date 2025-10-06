namespace Yoma.Core.Infrastructure.Substack.Models
{
  public class NewsArticleRaw
  {
    public string ExternalId { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public string URL { get; set; }

    public string? ThumbnailURL { get; set; }

    public DateTimeOffset PublishedDate { get; set; }
  }
}
