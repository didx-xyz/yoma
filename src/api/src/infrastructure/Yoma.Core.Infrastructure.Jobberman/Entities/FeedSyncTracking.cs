using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Jobberman.Entities
{
  [Table("FeedSyncTracking", Schema = "Jobberman")]
  [Index(nameof(CountryCodeAlpha2), IsUnique = true)]
  public sealed class FeedSyncTracking : BaseEntity<Guid>
  {
    /// <summary>
    /// Country feed identifier, e.g. NG or GH.
    /// One Jobberman RSS feed is configured per country.
    /// </summary>
    [Required]
    [Column(TypeName = "varchar(2)")]
    public string CountryCodeAlpha2 { get; set; } = null!;

    [Column(TypeName = "varchar(512)")]
    public string? ETag { get; set; }

    public DateTimeOffset? FeedLastModified { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
