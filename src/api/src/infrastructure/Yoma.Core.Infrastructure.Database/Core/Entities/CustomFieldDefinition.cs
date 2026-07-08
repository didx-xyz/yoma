using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
  [Table("CustomFieldDefinition", Schema = "Core")]
  [Index(nameof(EntityType), nameof(EntityContext), nameof(Key))]
  [Index(nameof(EntityType), nameof(EntityContext), nameof(IsActive), nameof(Group), nameof(SubGroup), nameof(SortOrder))]
  [Index(nameof(EntityType), nameof(EntityContext), nameof(DataType), nameof(IsRequired), nameof(IsSystem))]
  public sealed class CustomFieldDefinition : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string EntityType { get; set; } = null!; // Opportunity, MyOpportunity

    [Column(TypeName = "varchar(100)")]
    public string? EntityContext { get; set; } // null = all; otherwise Job/Learning/Event/Task/Other

    [Required]
    [Column(TypeName = "varchar(100)")]
    public string Key { get; set; } = null!; // stable technical identifier, e.g. salary

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string Title { get; set; } = null!;

    [Column(TypeName = "varchar(500)")]
    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "varchar(100)")]
    public string Group { get; set; } = null!;

    [Column(TypeName = "varchar(100)")]
    public string? SubGroup { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string DataType { get; set; } = null!; // String, Integer, Decimal, Boolean, DateTime, Option

    [Column(TypeName = "text")]
    public string? DefaultValue { get; set; }

    [Column(TypeName = "varchar(500)")]
    public string? ValidationRegex { get; set; }

    [Column(TypeName = "varchar(500)")]
    public string? ValidationErrorMessage { get; set; }

    [Required]
    public bool IsRequired { get; set; }

    public bool? SupportsMultiple { get; set; }

    [Required]
    public int SortOrder { get; set; }

    [Required]
    public bool IsActive { get; set; }

    [Required]
    public bool IsSystem { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<CustomFieldOption>? Options { get; set; }
  }
}
