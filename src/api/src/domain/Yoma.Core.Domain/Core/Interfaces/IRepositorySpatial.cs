namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositorySpatial<T> : IRepository<T> where T : class
  {
    /// <summary>
    /// Restrict the query to records within the radius in kilometres of the longitude/latitude pair.
    /// </summary>
    IQueryable<T> WithinRadius(IQueryable<T> query, double[] coordinates, double radiusKm);
  }
}
