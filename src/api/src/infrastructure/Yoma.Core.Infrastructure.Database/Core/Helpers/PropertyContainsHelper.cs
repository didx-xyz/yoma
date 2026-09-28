using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace Yoma.Core.Infrastructure.Database.Core.Helpers
{
  public static class PropertyContainsHelper
  {
    public static Expression<Func<T, bool>> Contains<T>(Expression<Func<T, string?>> property, string value)
    {
      ArgumentNullException.ThrowIfNull(property);
      ArgumentNullException.ThrowIfNull(value);

      // Build a case-insensitive substring predicate that EF translates to PostgreSQL ILIKE.
      var pattern = $"%{value}%";
      Expression<Func<string?, bool>> match = text => EF.Functions.ILike(text!, pattern);
      var body = ReplacingExpressionVisitor.Replace(match.Parameters[0], property.Body, match.Body);
      return Expression.Lambda<Func<T, bool>>(body, property.Parameters);
    }
  }
}
