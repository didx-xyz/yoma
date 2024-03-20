namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryValueContainsWithNavigation<T> : IRepositoryValueContains<T>, IRepositoryWithNavigation<T>
    where T : class
  {
  }
}
