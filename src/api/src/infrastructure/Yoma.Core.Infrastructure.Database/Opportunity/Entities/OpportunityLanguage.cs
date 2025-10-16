using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunityLanguages", Schema = "Opportunity")]
  [Index(nameof(OpportunityId), nameof(LanguageId), IsUnique = true)]
  public class OpportunityLanguage : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; } = null!;

    [Required]
    [ForeignKey("LanguageId")]
    public Guid LanguageId { get; set; }
    public Language Language { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
