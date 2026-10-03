using FluentValidation;
using System.Globalization;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class CustomFieldExtensions
  {
    #region Public Members
    /// <summary>
    /// Reads a normalized scalar from the complete custom-field state returned by the value service.
    /// Domain rules use stable keys; they must not resolve or compare editable display labels.
    /// </summary>
    public static string? Scalar(this IEnumerable<CustomFieldValueItem>? values, string key)
    {
      return values?.SingleOrDefault(o => string.Equals(o.Key, key, StringComparison.OrdinalIgnoreCase))?.Value;
    }

    /// <summary>
    /// Reads normalized option keys or lookup IDs, including preserved values after a partial update.
    /// </summary>
    public static IReadOnlyList<string> Selections(this IEnumerable<CustomFieldValueItem>? values, string key)
    {
      return values?.SingleOrDefault(o => string.Equals(o.Key, key, StringComparison.OrdinalIgnoreCase))?.Values ?? [];
    }

    /// <summary>
    /// Reads an already validated numeric scalar using the framework's invariant representation.
    /// </summary>
    public static decimal? Number(this IEnumerable<CustomFieldValueItem>? values, string key)
    {
      var value = values.Scalar(key);
      return value == null ? null : decimal.Parse(value, CultureInfo.InvariantCulture);
    }

    /// <summary>
    /// Reads an already validated boolean scalar; an unspecified field remains null.
    /// </summary>
    public static bool? Boolean(this IEnumerable<CustomFieldValueItem>? values, string key)
    {
      var value = values.Scalar(key);
      return value == null ? null : bool.Parse(value);
    }

    /// <summary>
    /// Resolves an inline selection from the definition's current active options.
    /// API values use keys; imports and partner mappings may explicitly allow display names.
    /// Lookup-backed fields retain their lookup-specific resolution in the value service.
    /// </summary>
    public static string ResolveOptionKey(this CustomFieldDefinition definition, string value, bool allowName = false)
    {
      ArgumentNullException.ThrowIfNull(definition);
      ArgumentException.ThrowIfNullOrWhiteSpace(value);

      if (definition.DataType != CustomFieldDataType.Option || definition.LookupType.HasValue)
        throw new InvalidOperationException($"Custom field '{definition.Key}' does not use inline options");

      value = value.Trim();
      var option = definition.Options?.SingleOrDefault(o =>
        o.IsActive &&
        (string.Equals(o.Key, value, StringComparison.OrdinalIgnoreCase) ||
          (allowName && string.Equals(o.Name, value, StringComparison.OrdinalIgnoreCase))));

      return option?.Key ?? throw new ValidationException(
        $"Custom field '{definition.Title}' contains an invalid option value: {value}");
    }

    /// <summary>
    /// Builds an option request from seeded metadata after the caller maps its source vocabulary.
    /// The ordinary CF validation still enforces context, cardinality and requiredness on save.
    /// </summary>
    public static CustomFieldValueRequest ToOptionRequest(this CustomFieldDefinition definition, params string[] values)
    {
      ArgumentNullException.ThrowIfNull(definition);
      ArgumentNullException.ThrowIfNull(values);

      return new CustomFieldValueRequest
      {
        Key = definition.Key,
        Values = [.. values.Select(value => definition.ResolveOptionKey(value, true))]
      };
    }

    public static bool Process(this CustomFieldUpsertMode mode)
    {
      return mode switch
      {
        CustomFieldUpsertMode.None => false,
        CustomFieldUpsertMode.PutEnforceRequired => true,
        CustomFieldUpsertMode.PatchAllowMissingRequired => true,
        _ => throw new InvalidOperationException($"Custom field upsert mode '{mode}' is not supported")
      };
    }

    public static bool EnforceRequired(this CustomFieldUpsertMode mode)
    {
      return mode switch
      {
        CustomFieldUpsertMode.None => false,
        CustomFieldUpsertMode.PutEnforceRequired => true,
        CustomFieldUpsertMode.PatchAllowMissingRequired => false,
        _ => throw new InvalidOperationException($"Custom field upsert mode '{mode}' is not supported")
      };
    }

    public static bool DeleteOmitted(this CustomFieldUpsertMode mode)
    {
      return mode switch
      {
        CustomFieldUpsertMode.None => false,
        CustomFieldUpsertMode.PutEnforceRequired => true,
        CustomFieldUpsertMode.PatchAllowMissingRequired => false,
        _ => throw new InvalidOperationException($"Custom field upsert mode '{mode}' is not supported")
      };
    }

    public static bool DeleteNullOrEmptyValues(this CustomFieldUpsertMode mode)
    {
      return mode switch
      {
        CustomFieldUpsertMode.None => false,
        CustomFieldUpsertMode.PutEnforceRequired => false,
        CustomFieldUpsertMode.PatchAllowMissingRequired => true,
        _ => throw new InvalidOperationException($"Custom field upsert mode '{mode}' is not supported")
      };
    }

    public static void NormalizeForPatch(this List<CustomFieldValueRequest>? items)
    {
      if (items == null) return;

      foreach (var item in items)
      {
        item.Key = item.Key?.Trim()!;

        item.Value = item.Value?.Trim();
        if (string.IsNullOrEmpty(item.Value)) item.Value = null;

        if (item.Values != null)
          item.Values = [.. item.Values.Select(o => o?.Trim()!)];

        // In PATCH flows, supplying only a key means delete that field. Keep this as
        // internal state so the public request contract remains key/value based.
        item.Delete = string.IsNullOrEmpty(item.Value) &&
          (item.Values == null || item.Values.Count == 0);
      }
    }

    public static void NormalizeForHashing(this List<CustomFieldValueRequest>? items)
    {
      if (items == null) return;

      items.ForEach(o => o.Values = o.Values?.OrderBy(value => value, StringComparer.OrdinalIgnoreCase).ToList());
      items.Sort((left, right) => StringComparer.OrdinalIgnoreCase.Compare(left.Key, right.Key));
    }

    public static List<CustomFieldFilter>? NormalizeForHashing(this List<CustomFieldFilter>? filters)
    {
      if (filters == null) return null;

      filters.ForEach(o =>
      {
        if (o != null) o.Values = o.Values?.OrderBy(value => value, StringComparer.OrdinalIgnoreCase).ToList();
      });

      return [.. filters
        .OrderBy(o => o?.Key, StringComparer.OrdinalIgnoreCase)
        .ThenBy(o => o?.Operator)
        .ThenBy(o => o?.Unspecified)
        .ThenBy(o => o?.Value, StringComparer.Ordinal)
        .ThenBy(o => o?.ValueTo, StringComparer.Ordinal)
        .ThenBy(o => string.Join(CustomFieldValue.Value_Delimiter, o?.Values ?? []), StringComparer.Ordinal)];
    }
    #endregion
  }
}
