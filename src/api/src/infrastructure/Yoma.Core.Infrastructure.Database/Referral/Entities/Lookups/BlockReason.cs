using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities.Lookups
{
  [Table("BlockReason", Schema = "Referral")]
  [Index(nameof(Name), IsUnique = true)]
  public class BlockReason : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string Name { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string Description { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
