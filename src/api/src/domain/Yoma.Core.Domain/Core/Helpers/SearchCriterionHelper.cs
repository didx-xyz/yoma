using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class SearchCriterionHelper
  {
    /// <summary>
    /// Compose SQL-translatable match and missing predicates without treating a known
    /// non-match as missing. The caller supplies the criterion's documented default.
    /// </summary>
    public static Expression<Func<T, bool>> Apply<T>(
      Expression<Func<T, bool>> match,
      Expression<Func<T, bool>> missing,
      UnspecifiedMatch? mode,
      UnspecifiedMatch defaultMode = UnspecifiedMatch.Exclude)
    {
      return (mode ?? defaultMode) switch
      {
        UnspecifiedMatch.Exclude => match.And(Not(missing)),
        UnspecifiedMatch.Include => match.Or(missing),
        UnspecifiedMatch.Only => missing,
        _ => throw new NotSupportedException($"Unspecified mode '{mode}' is not supported")
      };
    }

    public static Expression<Func<T, bool>> Not<T>(Expression<Func<T, bool>> predicate)
    {
      return Expression.Lambda<Func<T, bool>>(Expression.Not(predicate.Body), predicate.Parameters);
    }

    /// <summary>
    /// Validate the common value/mode contract. Required fields cannot acquire an
    /// artificial missing state; empty comparisons need an explicit Only policy.
    /// </summary>
    public static bool IsValid<T>(SearchCriterion<T>? criterion, bool hasValue, bool supportsUnspecified = true)
    {
      if (criterion == null) return true;
      if (!supportsUnspecified && criterion.Unspecified.HasValue) return false;
      if (criterion.Unspecified.HasValue && !Enum.IsDefined(criterion.Unspecified.Value)) return false;

      return criterion.Unspecified switch
      {
        null => hasValue,
        UnspecifiedMatch.Include or UnspecifiedMatch.Exclude => hasValue,
        UnspecifiedMatch.Only => !hasValue && criterion.Value is null,
        _ => throw new NotSupportedException($"Unspecified mode '{criterion.Unspecified}' is not supported")
      };
    }
  }
}
