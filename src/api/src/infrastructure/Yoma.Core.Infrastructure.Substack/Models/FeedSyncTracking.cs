using Yoma.Core.Domain.NewsFeedProvider;

namespace Yoma.Core.Infrastructure.Substack.Models
{
  public class FeedSyncTracking
  {
    public Guid Id { get; set; }

    public string FeedType { get; set; }

    public string? ETag { get; set; }

    public DateTimeOffset? FeedLastModified { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
