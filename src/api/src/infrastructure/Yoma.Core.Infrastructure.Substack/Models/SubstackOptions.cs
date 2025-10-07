using Yoma.Core.Domain.NewsFeedProvider;

namespace Yoma.Core.Infrastructure.Substack.Models
{
  public class SubstackOptions
  {
    public const string Section = "Substack";

    public string PollSchedule { get; init; }

    public int RetentionDays { get; init; }

    public int RequestTimeoutSeconds { get; init; }

    public string UserAgent { get; init; }

    public Dictionary<FeedType, string> Feeds { get; set; }
  }
}
