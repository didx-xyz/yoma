using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Interfaces.Lookups
{
  public interface IOpportunityCategoryService
  {
    OpportunityCategory GetByName(string name);

    OpportunityCategory? GetByNameOrNull(string name);

    OpportunityCategory GetById(Guid id);

    OpportunityCategory? GetByIdOrNull(Guid id);

    List<OpportunityCategory> Contains(string value);

    List<OpportunityCategory> List();
  }
}
