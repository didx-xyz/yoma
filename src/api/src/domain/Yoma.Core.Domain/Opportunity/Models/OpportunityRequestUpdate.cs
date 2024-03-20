using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityRequestUpdate : OpportunityRequestBase
  {
    [Required]
    public Guid Id { get; set; }
  }
}
