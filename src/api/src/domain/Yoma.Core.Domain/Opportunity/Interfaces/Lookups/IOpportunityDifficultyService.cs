using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Interfaces.Lookups
{
  public interface IOpportunityDifficultyService
  {
    OpportunityDifficulty GetByName(string name);

    OpportunityDifficulty? GetByNameOrNull(string name);

    OpportunityDifficulty GetById(Guid id);

    OpportunityDifficulty? GetByIdOrNull(Guid id);

    List<OpportunityDifficulty> List();
  }
}
