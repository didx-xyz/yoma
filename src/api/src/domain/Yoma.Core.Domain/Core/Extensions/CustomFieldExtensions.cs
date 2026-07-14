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
        CustomFieldUpsertMode.ProcessEnforceRequired => true,
        CustomFieldUpsertMode.ProcessAllowMissingRequired => true,
        _ => throw new InvalidOperationException($"Custom field upsert mode '{mode}' is not supported")
      };
    }

    public static bool EnforceRequired(this CustomFieldUpsertMode mode)
    {
      return mode switch
      {
        CustomFieldUpsertMode.None => false,
        CustomFieldUpsertMode.ProcessEnforceRequired => true,
        CustomFieldUpsertMode.ProcessAllowMissingRequired => false,
        _ => throw new InvalidOperationException($"Custom field upsert mode '{mode}' is not supported")
      };
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
