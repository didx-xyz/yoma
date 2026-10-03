using System.Linq.Expressions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Domain.Opportunity.Helpers
{
  public static class OpportunityPublishedStateHelper
  {
    /// <summary>
    /// Share date-aware published-state rules across search and reference-list
    /// projections. A delayed expiry job cannot leave past-end records in Active.
    /// One captured UTC instant is used for every state in the query.
    /// </summary>
    public static Expression<Func<T, bool>> Predicate<T>(IEnumerable<PublishedState> states,
      Expression<Func<T, Guid>> status, Expression<Func<T, DateTimeOffset>> start,
      Expression<Func<T, DateTimeOffset?>> end, Guid activeId, Guid expiredId, DateTimeOffset now)
    {
      var parameter = Expression.Parameter(typeof(T), "item");
      var statusValue = Replace(status, parameter);
      var startValue = Replace(start, parameter);
      var endValue = Replace(end, parameter);
      var active = Expression.Equal(statusValue, Expression.Constant(activeId));
      var hasEnd = Expression.Property(endValue, nameof(Nullable<>.HasValue));
      var endDate = Expression.Property(endValue, nameof(Nullable<>.Value));
      var pastEnd = Expression.AndAlso(hasEnd, Expression.LessThan(endDate, Expression.Constant(now)));
      var predicate = PredicateBuilder.False<T>();

      foreach (var state in states)
      {
        var body = state switch
        {
          PublishedState.NotStarted => Expression.AndAlso(active, Expression.AndAlso(
            Expression.GreaterThan(startValue, Expression.Constant(now)), Expression.Not(pastEnd))),
          PublishedState.Active => Expression.AndAlso(active, Expression.AndAlso(
            Expression.LessThanOrEqual(startValue, Expression.Constant(now)), Expression.Not(pastEnd))),
          PublishedState.Expired => Expression.OrElse(Expression.Equal(statusValue, Expression.Constant(expiredId)),
            Expression.AndAlso(active, pastEnd)),
          _ => throw new NotSupportedException($"Published state '{state}' is not supported")
        };
        predicate = predicate.Or(Expression.Lambda<Func<T, bool>>(body, parameter));
      }
      return predicate;
    }

    private static Expression Replace(LambdaExpression expression, ParameterExpression parameter)
    {
      return new ParameterReplacement(expression.Parameters[0], parameter).Visit(expression.Body)!;
    }

    private sealed class ParameterReplacement(ParameterExpression from, ParameterExpression to) : ExpressionVisitor
    {
      protected override Expression VisitParameter(ParameterExpression node) => node == from ? to : node;
    }
  }
}
