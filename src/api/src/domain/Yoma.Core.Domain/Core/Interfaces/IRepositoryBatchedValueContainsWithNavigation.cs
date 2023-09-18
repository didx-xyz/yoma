namespace Yoma.Core.Domain.Core.Interfaces
{
    public interface IRepositoryBatchedValueContainsWithNavigation<T> : IRepositoryBatched<T>, IRepositoryValueContains<T>, IRepositoryWithNavigation<T>
    where T : class
    {
    }
}
