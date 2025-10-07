using Newtonsoft.Json;
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

    public Dictionary<FeedType, SubstackOptionsFeed> Feeds { get; set; }
  }

  public class SubstackOptionsFeed
  {
    public string Title { get; init; } = string.Empty;

    public string URL { get; init; } = string.Empty;

    [JsonIgnore]
    public string FeedURL => $"{URL.TrimEnd('/')}/feed";
  }
}
