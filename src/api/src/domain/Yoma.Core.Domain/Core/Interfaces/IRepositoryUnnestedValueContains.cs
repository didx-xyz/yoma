using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryBatchedValueContainsWithUnnested<T> : IRepositoryBatchedValueContains<T>
    where T : class
  {
    IQueryable<UnnestedValue> UnnestValues(IEnumerable<string> values);
  }
}
