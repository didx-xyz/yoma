namespace Yoma.Core.Domain.NewsFeedProvider.Models
{
  public class NewsArticle
  {
    public Guid Id { get; set; }

    public string FeedType { get; set; } = null!;

    public string ExternalId { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string URL { get; set; } = null!;

    public string? ThumbnailURL { get; set; }

    public DateTimeOffset PublishedDate { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
