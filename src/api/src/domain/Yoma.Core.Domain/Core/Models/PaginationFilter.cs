using Newtonsoft.Json;
using System.Diagnostics.CodeAnalysis;

namespace Yoma.Core.Domain.Core.Models
{
  public class PaginationFilter
  {
    public int? PageNumber { get; set; }

    public int? PageSize { get; set; }

    [JsonIgnore]
    internal bool PaginationEnabled => PageSize.HasValue || PageNumber.HasValue;

    [MemberNotNull(nameof(PageNumber), nameof(PageSize))]
    internal void EnsurePagination()
    {
      if (!PaginationEnabled)
        throw new InvalidOperationException("Pagination criteria required");

      if (!PageNumber.HasValue || PageNumber.Value <= 0)
        throw new InvalidOperationException($"{nameof(PageNumber)} must be greater than 0");

      if (!PageSize.HasValue || PageSize.Value <= 0)
        throw new InvalidOperationException($"{nameof(PageNumber)} must be greater than 0");
    }
  }
}
