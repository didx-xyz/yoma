namespace Yoma.Core.Domain.Core.Interfaces
{
    public interface IRepositoryBatched<T> : IRepository<T>
        where T : class
    {
        Task<List<T>> Create(List<T> items);

        Task Update(List<T> items);
    }
}
