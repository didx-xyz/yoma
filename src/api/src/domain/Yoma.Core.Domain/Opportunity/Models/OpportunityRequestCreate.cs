using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityRequestCreate : OpportunityRequestBase
  {
    [Required]
    public bool PostAsActive { get; set; }
  }
}
