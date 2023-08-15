using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
  [Table("Skill", Schema = "lookup")]
  [Index(nameof(Name), IsUnique = true)]
  [Index(nameof(ExternalId), IsUnique = true)]
  public class Skill : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(255)")]
    public string Name { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? InfoURL { get; set; }

    [Required]
    [Column(TypeName = "varchar(100)")]
    public string ExternalId { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
