namespace Yoma.Core.Infrastructure.Jobberman.Models
{
  public sealed class Opportunity
  {
    public Guid Id { get; set; }

    /// <summary>
    /// Globally unique external identifier used by Yoma partner sync.
    /// Format: {CountryCodeAlpha2}:{SourceId}, e.g. NG:1223330.
    /// Must not exceed 50 characters.
    /// </summary>
    public string ExternalId { get; set; } = null!;

    /// <summary>
    /// Country feed identifier, e.g. NG or GH.
    /// </summary>
    public string CountryCodeAlpha2 { get; set; } = null!;

    /// <summary>
    /// Raw Jobberman RSS guid value.
    /// </summary>
    public string SourceId { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? URL { get; set; }

    public string? ImageURL { get; set; }

    public string? Location { get; set; }

    public string? WorkType { get; set; }

    /// <summary>
    /// Partner-supplied start, published, created, or posted date.
    /// </summary>
    public DateTimeOffset? DateStart { get; set; }

    /// <summary>
    /// Partner-supplied end, expiry, closing, or removal date.
    /// </summary>
    public DateTimeOffset? DateEnd { get; set; }

    /// <summary>
    /// Partner-supplied category or job function value.
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// Partner-supplied language value.
    /// </summary>
    public string? Language { get; set; }

    /// <summary>
    /// Partner-supplied deleted, removed, expired, or closed indicator.
    /// </summary>
    public bool? Deleted { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
