using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities.Lookups
{
  [Table("OpportunityVerificationType", Schema = "Opportunity")]
  [Index(nameof(Name), IsUnique = true)]
  public class OpportunityVerificationType : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; }

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string DisplayName { get; set; }

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string Description { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

  }
}
