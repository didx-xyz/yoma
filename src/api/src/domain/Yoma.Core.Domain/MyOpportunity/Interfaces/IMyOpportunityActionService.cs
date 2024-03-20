using Yoma.Core.Domain.MyOpportunity.Models.Lookups;

namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
  public interface IMyOpportunityActionService
  {
    MyOpportunityAction GetByName(string name);

    MyOpportunityAction? GetByNameOrNull(string name);

    MyOpportunityAction GetById(Guid id);

    MyOpportunityAction? GetByIdOrNull(Guid id);

    List<MyOpportunityAction> List();
  }
}
