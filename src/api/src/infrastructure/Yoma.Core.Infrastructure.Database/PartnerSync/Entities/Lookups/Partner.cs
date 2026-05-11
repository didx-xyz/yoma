using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.PartnerSync.Entities.Lookups
{
  [Table("Partner", Schema = "PartnerSync")]
  [Index(nameof(Name), IsUnique = true)]
  public class Partner : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(20)")]
    public string Name { get; set; } = null!;

    [Required]
    public bool Active { get; set; }

    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string SyncTypesEnabled { get; set; } = null!; //json key value pair of sync type:list of entity types

    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string? ActionEnabled { get; set; } //json list of enabled actions

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
