using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Entities
{
  [Table("ActionLink", Schema = "Link")]
  [Index(nameof(ShortURL), IsUnique = true)]
  [Index(nameof(EntityType), nameof(ActionId), nameof(StatusId), nameof(OpportunityId), nameof(DateEnd), nameof(DateCreated))]
  public class Link : BaseEntity<Guid>
  {
    //support specials characters like emojis  
    [Required]
    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string Description { get; set; }

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string EntityType { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid ActionId { get; set; }
    public Lookups.LinkAction Action { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public Lookups.LinkStatus Status { get; set; }

    [ForeignKey("OpportunityId")]
    public Guid? OpportunityId { get; set; }
    public Opportunity.Entities.Opportunity? Opportunity { get; set; }

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string ShortURL { get; set; }

    [Required]
    public int ParticipantLimit { get; set; }

    public int? ParticipantCount { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    [Column(TypeName = "jsonb ")]
    public string? DistributionList { get; set; }

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
  }
}
