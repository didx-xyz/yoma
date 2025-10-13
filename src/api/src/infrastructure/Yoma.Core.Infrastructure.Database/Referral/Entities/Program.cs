using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Domain.Referral.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("Program", Schema = "Referral")] 
  [Index(nameof(Name), IsUnique = true)]
  [Index(nameof(Description), nameof(StatusId), nameof(IsDefault), nameof(DateStart), nameof(DateEnd),
    nameof(DateCreated), nameof(CreatedByUserId), nameof(DateModified), nameof(ModifiedByUserId))]
  public class Program : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(255)")] //MS SQL: nvarchar(255)
    public string Name { get; set; }

    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string? Description { get; set; }

    public int? CompletionWindowInDays { get; set; }

    public int? CompletionLimitReferee { get; set; }

    public int? CompletionLimit { get; set; }

    public int? CompletionTotal { get; set; }

    [Column(TypeName = "decimal(8,2)")]
    public decimal? ZltoRewardReferrer { get; set; }

    [Column(TypeName = "decimal(8,2)")]
    public decimal? ZltoRewardReferee { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardPool { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardCumulative { get; set; }

    [Required]
    public bool ProofOfPersonhoodRequired { get; set; }

    [Required]
    public bool PathwaysRequired { get; set; }

    [Required]
    public bool MultipleLinksAllowed { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public ProgramStatus Status { get; set; }

    [Required]
    public bool IsDefault { get; set; }

    [Required]
    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    [ForeignKey("CreatedByUserId")]
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    [Required]
    [ForeignKey("ModifiedByUserId")]
    public Guid ModifiedByUserId { get; set; }
    public User ModifiedByUser { get; set; }

    public ProgramPathway? Pathway { get; set; }
  }
}
