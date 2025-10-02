namespace Yoma.Core.Domain.NewsFeedProvider.Models
{
  public class NewsArticle
  {
    public Guid Id { get; set; }

    public string ExternalId { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public string URL { get; set; }

    public string ThumbnailURL { get; set; }

    public DateTimeOffset PublishedDate { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
