namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IPaginationFilter
  {
    int? PageNumber { get; }

    int? PageSize { get; }

    bool PaginationEnabled { get; }
  }
}
