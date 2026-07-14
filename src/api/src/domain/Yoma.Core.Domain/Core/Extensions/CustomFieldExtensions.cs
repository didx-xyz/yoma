using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class CustomFieldExtensions
  {
    #region Public Members
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

      filters.ForEach(o => o.Values = o.Values?.OrderBy(value => value, StringComparer.OrdinalIgnoreCase).ToList());

      return [.. filters
        .OrderBy(o => o.Key, StringComparer.OrdinalIgnoreCase)
        .ThenBy(o => o.Operator)
        .ThenBy(o => o.Value, StringComparer.Ordinal)
        .ThenBy(o => string.Join(CustomFieldValue.Value_Delimiter, o.Values ?? []), StringComparer.Ordinal)];
    }
    #endregion
  }
}
