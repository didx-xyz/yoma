namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryTrackingTotals<T> : IRepository<T>
    where T : class
  {
    /// <summary>
    /// Updates only lifecycle-owned running totals and their audit fields. Ordinary updates
    /// preserve these totals. The caller owns the transaction and locks used to calculate them.
    /// </summary>
    Task<T> UpdateTrackingTotals(T item);
  }
}
