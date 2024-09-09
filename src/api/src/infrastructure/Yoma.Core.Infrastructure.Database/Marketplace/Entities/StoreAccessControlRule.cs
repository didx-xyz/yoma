using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Infrastructure.Database.Marketplace.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Entities
{
  [Table("StoreAccessControlRule", Schema = "Marketplace")]
  [Index(nameof(Name), nameof(OrganizationId), nameof(StoreId), nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
  public class StoreAccessControlRule : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(255)")] //MS SQL: nvarchar(255)
    public string Name { get; set; }

    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(MAX)
    public string? Description { get; set; }

    [Required]
    [ForeignKey("OrganizationId")]
    public Guid OrganizationId { get; set; }
    public Entity.Entities.Organization Organization { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string StoreId { get; set; }

    [Required] //nullable column results in an EF error: 22P02 invalid input syntax for type json
    [Column(TypeName = "jsonb")]
    public string StoreItemCategories { get; set; }

    public int? AgeMin { get; set; }

    public int? AgeMax { get; set; }

    [ForeignKey("GenderId")]
    public Guid? GenderId { get; set; }
    public Gender? Gender { get; set; }

    [Column(TypeName = "varchar(10)")]
    public string? OpportunityOption { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public StoreAccessControlRuleStatus Status { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<Opportunity.Entities.Opportunity>? Opportunities { get; set; }

  }
}
