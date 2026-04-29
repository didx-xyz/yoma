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
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string ExternalId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(2)")]
    public string CountryCodeAlpha2 { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(512)")]
    public string Title { get; set; } = null!;

    [Column(TypeName = "text")]
    public string? Description { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? URL { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? ImageURL { get; set; }

    [Column(TypeName = "varchar(512)")]
    public string? Location { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? WorkType { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    [Column(TypeName = "varchar(512)")]
    public string? Category { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? Language { get; set; }

    public bool? Deleted { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
