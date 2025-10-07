using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Entities.Lookups
{
  [Table("StoreAccessControlRuleStatus", Schema = "Marketplace")]
  [Index(nameof(Name), IsUnique = true)]
  public class StoreAccessControlRuleStatus : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(30)")]
    public string Name { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
