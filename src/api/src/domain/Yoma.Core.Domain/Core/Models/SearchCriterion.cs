using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Domain.Core.Models
{
  /// <summary>
  /// A comparison value and its explicit policy for genuinely missing data.
  /// Null criteria do not filter; false and zero remain real comparison values.
  /// </summary>
  public sealed class SearchCriterion<T>
  {
    public T? Value { get; set; }

    public UnspecifiedMatch? Unspecified { get; set; }
  }
}
