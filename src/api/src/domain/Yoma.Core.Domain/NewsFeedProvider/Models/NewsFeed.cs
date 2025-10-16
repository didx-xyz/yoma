namespace Yoma.Core.Domain.NewsFeedProvider.Models
{
  public class NewsFeed
  {
    public FeedType Type { get; set; }

    public string Title { get; set; } = null!;

    public string URL { get; set; } = null!;
  }
}
