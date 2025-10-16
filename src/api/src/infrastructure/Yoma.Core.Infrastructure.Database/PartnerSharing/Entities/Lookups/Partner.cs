using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.PartnerSharing.Entities.Lookups
{
  [Table("Partner", Schema = "PartnerSharing")]
  [Index(nameof(Name), IsUnique = true)]
  public class Partner : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(20)")]
    public string Name { get; set; } = null!;

    [Required]
    public bool Active { get; set; }

    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string? ActionEnabled { get; set; } //json key value pair of action:bool

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
