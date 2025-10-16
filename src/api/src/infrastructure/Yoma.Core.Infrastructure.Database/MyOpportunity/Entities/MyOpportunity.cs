using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Entities
{
  [Table("MyOpportunity", Schema = "Opportunity")]
  [Index(nameof(UserId), nameof(OpportunityId), nameof(ActionId), IsUnique = true)]
  [Index(nameof(VerificationStatusId), nameof(DateStart), nameof(DateEnd), nameof(DateCompleted), nameof(ZltoReward), nameof(YomaReward),
    nameof(Recommendable), nameof(StarRating), nameof(DateCreated), nameof(DateModified))]
  public class MyOpportunity : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity.Entities.Opportunity Opportunity { get; set; } = null!;

    [Required]
    [ForeignKey("ActionId")]
    public Guid ActionId { get; set; }
    public MyOpportunityAction Action { get; set; } = null!;

    [ForeignKey("VerificationStatusId")]
    public Guid? VerificationStatusId { get; set; }
    public MyOpportunityVerificationStatus? VerificationStatus { get; set; }

    [Column(TypeName = "varchar(500)")]
    public string? CommentVerification { get; set; }

    [ForeignKey("CommitmentIntervalId")]
    public Guid? CommitmentIntervalId { get; set; }
    public TimeInterval? CommitmentInterval { get; set; }

    public short? CommitmentIntervalCount { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    [Column(TypeName = "decimal(8,2)")]
    public decimal? ZltoReward { get; set; }

    [Column(TypeName = "decimal(8,2)")]
    public decimal? YomaReward { get; set; }

    public bool? Recommendable { get; set; }

    public byte? StarRating { get; set; }

    //support specials characters like emojis  
    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string? Feedback { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<MyOpportunityVerification>? Verifications { get; set; }
  }
}
