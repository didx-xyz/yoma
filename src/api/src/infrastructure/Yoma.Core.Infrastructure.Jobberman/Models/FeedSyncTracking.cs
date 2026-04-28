namespace Yoma.Core.Infrastructure.Jobberman.Models
{
  public sealed class FeedSyncTracking
  {
    public Guid Id { get; set; }

    public string CountryCodeAlpha2 { get; set; } = null!;

    public string? ETag { get; set; }

    public DateTimeOffset? FeedLastModified { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
