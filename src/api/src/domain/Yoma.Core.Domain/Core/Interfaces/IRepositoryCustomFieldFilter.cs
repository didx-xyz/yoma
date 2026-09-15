using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryCustomFieldFilter<T> where T : class
  {
    IQueryable<T> WhereCustomFields(IQueryable<T> query, List<CustomFieldFilter>? filters);
  }
}
