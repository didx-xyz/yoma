using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities.Lookups
{
  [Table("SettingsDefinition", Schema = "Entity")]
  [Index(nameof(EntityType), nameof(Key), IsUnique = true)]
  public class SettingsDefinition : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(25)")]
    public string EntityType { get; set; }

    [Required]
    [Column(TypeName = "varchar(100)")]
    public string Key { get; set; }

    [Required]
    [Column(TypeName = "varchar(100)")]
    public string Title { get; set; }

    [Required]
    [Column(TypeName = "varchar(500)")]
    public string Description { get; set; }

    [Required]
    [Column(TypeName = "varchar(100)")]
    public string Group { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? SubGroup { get; set; }

    [Required]
    public short Order { get; set; }

    [Required] //nullable column results in an EF error: 22P02 invalid input syntax for type json
    [Column(TypeName = "jsonb")]
    public string Roles { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string DefaultValue { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string Type { get; set; }

    [Required]
    public bool Enabled { get; set; }

    [Required]
    public bool Visible { get; set; }
  }
}
