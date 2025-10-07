using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Entities.Lookups
{
  [Table("MyOpportunityVerificationStatus", Schema = "Opportunity")]
  [Index(nameof(Name), IsUnique = true)]
  public class MyOpportunityVerificationStatus : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
