using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Entities.Lookups
{
  [Table("StoreAccessControlRuleStatus", Schema = "Marketplace")]
  [Index(nameof(Name), IsUnique = true)]
  public class StoreAccessControlRuleStatus : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(30)")]
    public string Name { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
