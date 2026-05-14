using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Alison.Entities
{
  [Table("Opportunity", Schema = "Alison")]
  [Index(nameof(ExternalId), IsUnique = true)]
  [Index(nameof(Deleted), nameof(DateModified))]
  [Index(nameof(ExternalId), nameof(DateCreated), nameof(DateModified))]
  public sealed class Opportunity : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string ExternalId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(128)")]
    public string PayloadHash { get; set; } = null!;

    [Required]
    [Column(TypeName = "jsonb")]
    public string PayloadJson { get; set; } = null!;

    public bool? Deleted { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
