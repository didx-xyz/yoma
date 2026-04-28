using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Jobberman.Entities
{
  [Table("Opportunity", Schema = "Jobberman")]
  [Index(nameof(ExternalId), IsUnique = true)]
  [Index(nameof(CountryCodeAlpha2), nameof(SourceId), IsUnique = true)]
  [Index(nameof(ExternalId), nameof(DateCreated), nameof(DateModified))]
  public sealed class Opportunity : BaseEntity<Guid>
  {
    /// <summary>
    /// Globally unique external identifier used by Yoma partner sync.
    /// Format: {CountryCodeAlpha2}:{SourceId}, e.g. NG:1223330.
    /// Must not exceed 50 characters.
    /// </summary>
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string ExternalId { get; set; } = null!;

    /// <summary>
    /// Country feed identifier, e.g. NG or GH.
    /// </summary>
    [Required]
    [Column(TypeName = "varchar(2)")]
    public string CountryCodeAlpha2 { get; set; } = null!;

    /// <summary>
    /// Raw Jobberman RSS guid value.
    /// </summary>
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(512)")]
    public string Title { get; set; } = null!;

    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string Description { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string URL { get; set; } = null!;

    [Column(TypeName = "varchar(2048)")]
    public string? ImageURL { get; set; }

    [Column(TypeName = "varchar(512)")]
    public string? Location { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? WorkType { get; set; }

    /// <summary>
    /// Partner-supplied start, published, created, or posted date.
    /// The exact source field is pending confirmation from Jobberman.
    /// </summary>
    [Required]
    public DateTimeOffset DateStart { get; set; }

    /// <summary>
    /// Partner-supplied end, expiry, closing, or removal date, if available.
    /// The current RSS feed sample does not include this field.
    /// </summary>
    public DateTimeOffset? DateEnd { get; set; }

    /// <summary>
    /// Partner-supplied category or job function value, if available.
    /// The current RSS feed sample does not include this as a dedicated field.
    /// </summary>
    [Column(TypeName = "varchar(512)")]
    public string? Category { get; set; }

    /// <summary>
    /// Partner-supplied language value, if available.
    /// The current RSS feed sample does not include this field.
    /// </summary>
    [Column(TypeName = "varchar(100)")]
    public string? Language { get; set; }

    /// <summary>
    /// Partner-supplied deleted, removed, expired, or closed indicator, if available.
    /// The current RSS feed sample does not include this field.
    /// </summary>
    public bool? Deleted { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
