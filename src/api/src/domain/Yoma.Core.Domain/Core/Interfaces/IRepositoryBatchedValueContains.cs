namespace Yoma.Core.Domain.Core.Interfaces
{
    public interface IRepositoryBatchedValueContains<T> : IRepositoryBatched<T>, IRepositoryValueContains<T>
        where T : class
    {
    }
}
