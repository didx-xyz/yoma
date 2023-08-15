using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunityLanguages", Schema = "opportunity")]
  [Index(nameof(OpportunityId), nameof(LanguageId), IsUnique = true)]
  public class OpportunityLanguage : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; }

    [Required]
    [ForeignKey("LanguageId")]
    public Guid LanguageId { get; set; }
    public Language Language { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
