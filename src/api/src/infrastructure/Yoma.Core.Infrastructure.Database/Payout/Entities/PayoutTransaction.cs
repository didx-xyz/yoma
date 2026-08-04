using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Payout.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.Payout.Entities
{
  [Table("Transaction", Schema = "Payout")]
  [Index(nameof(UserId), nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
  [Index(nameof(Provider), nameof(TransactionId), IsUnique = true)]
  public sealed class PayoutTransaction : Shared.Entities.BaseEntity<Guid>
  {
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string Type { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string Provider { get; set; } = null!;

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public PayoutTransactionStatus Status { get; set; } = null!;

    [Required]
    [Column(TypeName = "decimal(12,2)")]
    public decimal Amount { get; set; }

    [Required]
    [Column(TypeName = "varchar(10)")]
    public string Currency { get; set; } = null!;

    [Column(TypeName = "varchar(50)")]
    public string? TransactionId { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? PaymentUrl { get; set; }

    [Column(TypeName = "text")]
    public string? ErrorReason { get; set; }

    public DateTimeOffset? ExpiresAt { get; set; }

    public DateTimeOffset? RewardReservationExpiresAt { get; set; }

    public DateTimeOffset? DateLastReconciled { get; set; }

    public byte? RetryCount { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
