namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryBatchedTrackingTotals<T> : IRepositoryBatched<T>, IRepositoryTrackingTotals<T>
    where T : class
  {
    /// <summary>
    /// Updates only lifecycle-owned running totals and audit fields for the supplied items.
    /// The caller owns the transaction and locks used to calculate the totals.
    /// </summary>
    Task<List<T>> UpdateTrackingTotals(List<T> items);
  }
}
