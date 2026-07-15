using Microsoft.EntityFrameworkCore;
using System.Globalization;
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

      if (!filter.CustomFieldDefinitionId.HasValue)
        throw new InvalidOperationException($"Custom field filter '{filter.Key}' definition id has not been hydrated");

      // The domain resolves the active definition case-insensitively. Filtering by its
      // foreign key keeps the value query aligned with the covering indexes.
      var baseQuery = query
        .Where(o => o.CustomFieldDefinitionId == filter.CustomFieldDefinitionId.Value);

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
        CustomFieldFilterOperator.GreaterThan => MatchingComparison(baseQuery, entityType, filter),
        CustomFieldFilterOperator.GreaterThanOrEqual => MatchingComparison(baseQuery, entityType, filter),
        CustomFieldFilterOperator.LessThan => MatchingComparison(baseQuery, entityType, filter),
        CustomFieldFilterOperator.LessThanOrEqual => MatchingComparison(baseQuery, entityType, filter),
        CustomFieldFilterOperator.Between => MatchingBetween(baseQuery, entityType, filter),
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
        query.Where(o => EF.Functions.ILike(o.Value, $"%{value}%")),
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

    private static IQueryable<Guid> MatchingComparison(IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType, CustomFieldFilter filter)
    {
      if (string.IsNullOrWhiteSpace(filter.Value))
        return SelectEntityIds(Empty(query), entityType);

      var result = filter.DataType switch
      {
        CustomFieldDataType.Integer or CustomFieldDataType.Decimal =>
          ApplyNumericComparison(query, filter.Operator, ParseNumeric(filter.Value)),

        CustomFieldDataType.DateTime =>
          ApplyDateTimeComparison(query, filter.Operator, ParseDateTime(filter.Value)),

        _ => throw new InvalidOperationException(
          $"Custom field data type '{filter.DataType}' does not support filter operator '{filter.Operator}'")
      };

      return SelectEntityIds(result, entityType);
    }

    private static IQueryable<Guid> MatchingBetween(IQueryable<CustomFieldValueEntity> query, CustomFieldEntityType entityType, CustomFieldFilter filter)
    {
      if (string.IsNullOrWhiteSpace(filter.Value) || string.IsNullOrWhiteSpace(filter.ValueTo))
        return SelectEntityIds(Empty(query), entityType);

      var result = filter.DataType switch
      {
        CustomFieldDataType.Integer or CustomFieldDataType.Decimal =>
          ApplyNumericRange(query, ParseNumeric(filter.Value), ParseNumeric(filter.ValueTo)),

        CustomFieldDataType.DateTime =>
          ApplyDateTimeRange(query, ParseDateTime(filter.Value), ParseDateTime(filter.ValueTo)),

        _ => throw new InvalidOperationException(
          $"Custom field data type '{filter.DataType}' does not support filter operator '{filter.Operator}'")
      };

      return SelectEntityIds(result, entityType);
    }

    private static IQueryable<CustomFieldValueEntity> ApplyNumericComparison(
      IQueryable<CustomFieldValueEntity> query,
      CustomFieldFilterOperator filterOperator,
      decimal value)
    {
      return filterOperator switch
      {
        CustomFieldFilterOperator.GreaterThan => query.Where(o => o.ValueNumeric > value),
        CustomFieldFilterOperator.GreaterThanOrEqual => query.Where(o => o.ValueNumeric >= value),
        CustomFieldFilterOperator.LessThan => query.Where(o => o.ValueNumeric < value),
        CustomFieldFilterOperator.LessThanOrEqual => query.Where(o => o.ValueNumeric <= value),
        _ => throw new ArgumentOutOfRangeException(
          nameof(filterOperator),
          $"Custom field filter operator '{filterOperator}' is not a numeric comparison")
      };
    }

    private static IQueryable<CustomFieldValueEntity> ApplyDateTimeComparison(
      IQueryable<CustomFieldValueEntity> query,
      CustomFieldFilterOperator filterOperator,
      DateTimeOffset value)
    {
      return filterOperator switch
      {
        CustomFieldFilterOperator.GreaterThan => query.Where(o => o.ValueDateTime > value),
        CustomFieldFilterOperator.GreaterThanOrEqual => query.Where(o => o.ValueDateTime >= value),
        CustomFieldFilterOperator.LessThan => query.Where(o => o.ValueDateTime < value),
        CustomFieldFilterOperator.LessThanOrEqual => query.Where(o => o.ValueDateTime <= value),
        _ => throw new ArgumentOutOfRangeException(
          nameof(filterOperator),
          $"Custom field filter operator '{filterOperator}' is not a date/time comparison")
      };
    }

    private static IQueryable<CustomFieldValueEntity> ApplyNumericRange(
      IQueryable<CustomFieldValueEntity> query,
      decimal value,
      decimal valueTo)
    {
      return query.Where(o => o.ValueNumeric >= value && o.ValueNumeric <= valueTo);
    }

    private static IQueryable<CustomFieldValueEntity> ApplyDateTimeRange(
      IQueryable<CustomFieldValueEntity> query,
      DateTimeOffset value,
      DateTimeOffset valueTo)
    {
      return query.Where(o => o.ValueDateTime >= value && o.ValueDateTime <= valueTo);
    }

    private static IQueryable<CustomFieldValueEntity> ApplySingleValueFilter(IQueryable<CustomFieldValueEntity> query, CustomFieldDataType dataType, string value)
    {
      value = value.Trim();

      if (dataType == CustomFieldDataType.Integer || dataType == CustomFieldDataType.Decimal)
      {
        var numeric = ParseNumeric(value);
        return query.Where(o => o.ValueNumeric == numeric);
      }

      if (dataType == CustomFieldDataType.DateTime)
      {
        var dateTime = ParseDateTime(value);
        return query.Where(o => o.ValueDateTime == dateTime);
      }

      if (dataType != CustomFieldDataType.Option)
        return query.Where(o => o.Value == value);

      var token = ToOptionToken(value);
      return query.Where(o => o.Value == value || o.Value.Contains(token));
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

    private static decimal ParseNumeric(string value)
    {
      return decimal.Parse(value, NumberStyles.Number, CultureInfo.InvariantCulture);
    }

    private static DateTimeOffset ParseDateTime(string value)
    {
      return DateTimeOffset.Parse(
        value,
        CultureInfo.InvariantCulture,
        DateTimeStyles.RoundtripKind);
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
