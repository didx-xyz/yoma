using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
  [Table("CustomFieldOption", Schema = "Core")]
  [Index(nameof(CustomFieldDefinitionId), nameof(Key), IsUnique = true)]
  [Index(nameof(CustomFieldDefinitionId), nameof(IsActive), nameof(SortOrder))]
  public sealed class CustomFieldOption : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    public Guid CustomFieldDefinitionId { get; set; }

    [Required]
    [Column(TypeName = "varchar(100)")]
    public string Key { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string Name { get; set; } = null!;

    [Required]
    public int SortOrder { get; set; }

    [Required]
    public bool IsActive { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
