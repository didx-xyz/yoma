using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Reward.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.Reward.Entities
{
  [Table("WalletCreation", Schema = "Reward")]
  [Index(nameof(UserId), IsUnique = true)]
  [Index(nameof(Username), IsUnique = true)]
  [Index(nameof(Provider), nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
  public class WalletCreation : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(25)")]
    [DefaultValue(Domain.Reward.Provider.ZLTO)] // Default to ZLTO for historical data
    public string Provider { get; set; } = null!;

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public WalletCreationStatus Status { get; set; } = null!;

    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Column(TypeName = "varchar(320)")]
    public string? Username { get; set; }

    [Column(TypeName = "varchar(50)")]
    public string? WalletId { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? Balance { get; set; }

    [Column(TypeName = "text")] //MS SQL: varchar(MAX)
    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
