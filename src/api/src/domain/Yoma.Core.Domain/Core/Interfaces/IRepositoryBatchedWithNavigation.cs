namespace Yoma.Core.Domain.Core.Interfaces
{
    public interface IRepositoryBatchedWithNavigation<T> : IRepositoryBatched<T>, IRepositoryWithNavigation<T>
        where T : class
    {
    }
}
