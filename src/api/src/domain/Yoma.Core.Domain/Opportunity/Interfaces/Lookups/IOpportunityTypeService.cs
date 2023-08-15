using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Interfaces.Lookups
{
  public interface IOpportunityTypeService
  {
    OpportunityType GetByName(string name);

    OpportunityType? GetByNameOrNull(string name);

    OpportunityType GetById(Guid id);

    OpportunityType? GetByIdOrNull(Guid id);

    List<OpportunityType> List();
  }
}
