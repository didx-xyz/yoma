using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
  [Table("Gender", Schema = "lookup")]
  [Index(nameof(Name), IsUnique = true)]
  public class Gender : BaseEntity<Guid>
  {
    [Column(TypeName = "varchar(20)")]
    public string Name { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
