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
    /// Indicates whether the job was removed from the latest full Jobberman RSS snapshot.
    /// Removed from feed means removed/expired on Yoma's side.
    /// </summary>
    public bool? Deleted { get; set; }

    /// <summary>
    /// Indicates whether the job is a duplicate within the latest full Jobberman RSS snapshot.
    /// Duplicate jobs are kept in the Jobberman sync table for tracking/audit purposes, but are excluded from Yoma domain synchronization.
    /// </summary>
    public bool? Duplicate { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
