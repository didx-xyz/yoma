using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
  [Table("CustomFieldValue", Schema = "Core")]
  [Index(nameof(CustomFieldDefinitionId), nameof(OpportunityId))]
  [Index(nameof(CustomFieldDefinitionId), nameof(MyOpportunityId))]
  public sealed class CustomFieldValue : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    public Guid CustomFieldDefinitionId { get; set; }

    public Guid? OpportunityId { get; set; }

    public Guid? MyOpportunityId { get; set; }

    [Required]
    [Column(TypeName = "text")]
    public string Value { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public CustomFieldDefinition CustomFieldDefinition { get; set; } = null!;
  }
}
