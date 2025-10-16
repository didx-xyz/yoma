using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities.Lookups
{
  [Table("OpportunityType", Schema = "Opportunity")]
  [Index(nameof(Name), IsUnique = true)]
  public class OpportunityType : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(20)")]
    public string Name { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
