using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Interfaces.Lookups
{
    public interface IOpportunityVerificationTypeService
    {
        OpportunityVerificationType GetByName(string name);

        OpportunityVerificationType? GetByNameOrNull(string name);

        OpportunityVerificationType GetById(Guid id);

        OpportunityVerificationType? GetByIdOrNull(Guid id);

        List<OpportunityVerificationType> List();
    }
}
