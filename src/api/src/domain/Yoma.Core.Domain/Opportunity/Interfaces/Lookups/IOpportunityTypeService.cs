namespace Yoma.Core.Domain.Opportunity.Interfaces.Lookups
{
  public interface IOpportunityTypeService
  {
    Models.Lookups.OpportunityType GetByName(string name);

    Models.Lookups.OpportunityType? GetByNameOrNull(string name);

    Models.Lookups.OpportunityType GetById(Guid id);

    Models.Lookups.OpportunityType? GetByIdOrNull(Guid id);

    List<Models.Lookups.OpportunityType> Contains(string value);

    List<Models.Lookups.OpportunityType> List();
  }
}
