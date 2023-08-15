using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Interfaces.Lookups
{
  public interface IOpportunityStatusService
  {
    OpportunityStatus GetByName(string name);

    OpportunityStatus? GetByNameOrNull(string name);

    OpportunityStatus GetById(Guid id);

    OpportunityStatus? GetByIdOrNull(Guid id);

    List<OpportunityStatus> List();
  }
}
