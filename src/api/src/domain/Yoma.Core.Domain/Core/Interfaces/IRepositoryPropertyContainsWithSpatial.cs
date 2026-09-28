namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryPropertyContainsWithSpatial<T> :
    IRepositoryPropertyContains<T>, IRepositorySpatial<T>
    where T : class
  {
  }
}
