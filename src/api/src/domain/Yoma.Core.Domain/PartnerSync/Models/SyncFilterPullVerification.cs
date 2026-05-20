using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Filter used when pulling partner-managed verification records for a configured entity type.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context
  /// and is therefore not repeated on the filter.
  /// </summary>
  public sealed class SyncFilterPullVerification : PaginationFilter
  {
    public DateTimeOffset DateStart { get; set; }

    /// <summary>
    /// The optional inclusive end date for the verification lookup window.
    /// If omitted, the provider implementation should default to the current date/time where supported.
    /// </summary>
    public DateTimeOffset? DateEnd { get; set; }
  }
}
