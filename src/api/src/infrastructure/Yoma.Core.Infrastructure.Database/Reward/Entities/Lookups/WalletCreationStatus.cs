using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Reward.Entities.Lookups
{
  [Table("WalletCreationStatus", Schema = "Reward")]
  [Index(nameof(Name), IsUnique = true)]
  public class WalletCreationStatus : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string Name { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
