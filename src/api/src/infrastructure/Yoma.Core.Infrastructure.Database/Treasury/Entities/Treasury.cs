using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Treasury.Entities
{
  [Table("Treasury", Schema = "Treasury")]
  [Index(nameof(DateCreated), nameof(DateModified))]
  public sealed class Treasury : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Range(1, 12)]
    public byte FinancialYearStartMonth { get; set; }

    [Required]
    [Range(1, 31)]
    public byte FinancialYearStartDay { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateOnly FinancialYearStartDate { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardCumulative { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardCumulativeCurrentFinancialYear { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ChimoneyPoolCurrentFinancialYearInUSD { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ChimoneyCumulativeInUSD { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ChimoneyCumulativeCurrentFinancialYearInUSD { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,10)")]
    public decimal ConversionRateZltoUsd { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    [ForeignKey("CreatedByUserId")]
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    [Required]
    public DateTimeOffset DateModified { get; set; }

    [Required]
    [ForeignKey("ModifiedByUserId")]
    public Guid ModifiedByUserId { get; set; }
    public User ModifiedByUser { get; set; } = null!;
  }
}
