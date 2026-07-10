using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;
using CustomFieldValueEntity = Yoma.Core.Infrastructure.Database.Core.Entities.CustomFieldValue;
using CustomFieldValueModel = Yoma.Core.Domain.Core.Models.CustomFieldValue;

namespace Yoma.Core.Infrastructure.Database.Core.Extensions
{
  internal static class CustomFieldValueQueryableExtensions
  {
    #region Public Members
    public static IQueryable<Guid> MatchingEntityIds(this IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType, CustomFieldFilter filter)
    {
      if (filter.DataType == null)
        throw new InvalidOperationException($"Custom field filter '{filter.Key}' data type has not been hydrated");

      var key = filter.Key.Trim();

      var baseQuery = query
        .Where(o => o.CustomFieldDefinition.IsActive && o.CustomFieldDefinition.Key == key);

      baseQuery = entityType switch
      {
        CustomFieldEntityType.Opportunity => baseQuery.Where(o => o.OpportunityId.HasValue),
        CustomFieldEntityType.MyOpportunity => baseQuery.Where(o => o.MyOpportunityId.HasValue),
        _ => throw new ArgumentOutOfRangeException(nameof(entityType), $"Entity type '{entityType}' is not supported")
      };

      return filter.Operator switch
      {
        CustomFieldFilterOperator.Exists => SelectEntityIds(baseQuery, entityType),
        CustomFieldFilterOperator.Equals => MatchingEquals(baseQuery, entityType, filter),
        CustomFieldFilterOperator.Contains => MatchingContains(baseQuery, entityType, filter),
        CustomFieldFilterOperator.AnyOf => MatchingAnyOf(baseQuery, entityType, filter),
        CustomFieldFilterOperator.AllOf => MatchingAllOf(baseQuery, entityType, filter),
        _ => throw new ArgumentOutOfRangeException(nameof(filter), $"Custom field filter operator '{filter.Operator}' is not supported")
      };
    }
    #endregion

    #region Private Members
    private static IQueryable<Guid> MatchingEquals(IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType, CustomFieldFilter filter)
    {
      if (string.IsNullOrWhiteSpace(filter.Value))
        return SelectEntityIds(Empty(query), entityType);

      return SelectEntityIds(ApplySingleValueFilter(query, filter.DataType!.Value, filter.Value), entityType);
    }

    private static IQueryable<Guid> MatchingContains(IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType, CustomFieldFilter filter)
    {
      if (filter.DataType != CustomFieldDataType.String)
        throw new InvalidOperationException($"Custom field filter operator '{filter.Operator}' is only supported for '{CustomFieldDataType.String}' fields");

      if (string.IsNullOrWhiteSpace(filter.Value))
        return SelectEntityIds(Empty(query), entityType);

      var value = filter.Value.Trim();

      return SelectEntityIds(
        query.Where(o => o.Value != null && EF.Functions.ILike(o.Value, $"%{value}%")),
        entityType);
    }

    private static IQueryable<Guid> MatchingAnyOf(IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType, CustomFieldFilter filter)
    {
      var values = ParseValues(filter);
      if (values.Count == 0)
        return SelectEntityIds(Empty(query), entityType);

      IQueryable<Guid>? result = null;

      foreach (var value in values)
      {
        var ids = SelectEntityIds(ApplySingleValueFilter(query, filter.DataType!.Value, value), entityType);
        result = result == null ? ids : result.Union(ids);
      }

      return result ?? SelectEntityIds(Empty(query), entityType);
    }

    private static IQueryable<Guid> MatchingAllOf(IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType, CustomFieldFilter filter)
    {
      if (filter.DataType != CustomFieldDataType.Option)
        throw new InvalidOperationException($"Custom field filter operator '{filter.Operator}' is only supported for '{CustomFieldDataType.Option}' fields");

      var values = ParseValues(filter);
      if (values.Count == 0)
        return SelectEntityIds(Empty(query), entityType);

      var result = SelectEntityIds(ApplySingleValueFilter(query, filter.DataType!.Value, values[0]), entityType);

      foreach (var value in values.Skip(1))
      {
        var ids = SelectEntityIds(ApplySingleValueFilter(query, filter.DataType!.Value, value), entityType);
        result = result.Where(id => ids.Contains(id));
      }

      return result;
    }

    private static IQueryable<CustomFieldValueEntity> ApplySingleValueFilter(IQueryable<CustomFieldValueEntity> query, CustomFieldDataType dataType, string value)
    {
      value = value.Trim();

      if (dataType != CustomFieldDataType.Option)
        return query.Where(o => o.Value == value);

      var token = ToOptionToken(value);

      return query.Where(o => o.Value == value || (o.Value != null && o.Value.Contains(token)));
    }

    private static IQueryable<Guid> SelectEntityIds(IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType)
    {
      return entityType switch
      {
        CustomFieldEntityType.Opportunity => query.Select(o => o.OpportunityId!.Value),
        CustomFieldEntityType.MyOpportunity => query.Select(o => o.MyOpportunityId!.Value),
        _ => throw new ArgumentOutOfRangeException(nameof(entityType), $"Entity type '{entityType}' is not supported")
      };
    }

    private static List<string> ParseValues(CustomFieldFilter filter)
    {
      return filter.Values?
        .Where(o => !string.IsNullOrWhiteSpace(o))
        .Select(o => o.Trim())
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList() ?? [];
    }

    private static string ToOptionToken(string value)
    {
      return $"{CustomFieldValueModel.Value_Delimiter}{value}{CustomFieldValueModel.Value_Delimiter}";
    }

    private static IQueryable<CustomFieldValueEntity> Empty(IQueryable<CustomFieldValueEntity> query)
    {
      return query.Where(_ => false);
    }
    #endregion
  }
}
