using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Filter used when pulling partner-managed entity records.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context
  /// and is therefore not repeated on the filter.
  /// </summary>
  public sealed class SyncFilterPullEntity : PaginationFilter { }
}
