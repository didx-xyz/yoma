using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunitySearchFilterVerificationFiles
  {
    public Guid Opportunity { get; set; }

    public List<VerificationType>? VerificationTypes { get; set; }
   }
}
