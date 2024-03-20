using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Interfaces.Lookups
{
  public interface IOpportunityVerificationTypeService
  {
    OpportunityVerificationType GetByType(VerificationType type);

    OpportunityVerificationType? GetByTypeOrNull(VerificationType type);

    OpportunityVerificationType GetById(Guid id);

    OpportunityVerificationType? GetByIdOrNull(Guid id);

    List<OpportunityVerificationType> List();
  }
}
