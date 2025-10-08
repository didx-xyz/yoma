using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
  [Table("TenantCreationStatus", Schema = "SSI")]
  [Index(nameof(Name), IsUnique = true)]
  public class SSITenantCreationStatus : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(20)")]
    public string Name { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
