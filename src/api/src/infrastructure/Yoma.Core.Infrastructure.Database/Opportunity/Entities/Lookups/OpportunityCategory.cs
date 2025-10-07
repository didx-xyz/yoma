using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities.Lookups
{
  [Table("OpportunityCategory", Schema = "Opportunity")]
  [Index(nameof(Name), IsUnique = true)]
  public class OpportunityCategory : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; }

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string ImageURL { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
