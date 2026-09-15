using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Helpers
{
  /// <summary>
  /// Owns the shared presentation order for static schema properties, dynamic custom fields and rendered
  /// credential attributes. Configured groups render first, followed by ungrouped attributes. Each level
  /// falls back to the display label and stable attribute name to keep results deterministic.
  /// </summary>
  public static class SSIAttributePresentationHelper
  {
    /// <summary>
    /// Orders static schema properties for administration, keeping fixed system properties first.
    /// </summary>
    public static List<SSISchemaEntityProperty>? OrderProperties(List<SSISchemaEntityProperty>? properties)
    {
      if (properties == null) return null;

      return Order(
        properties,
        property => property.System,
        property => property.Group,
        property => property.SubGroup,
        property => property.SortOrder,
        property => property.NameDisplay,
        property => property.AttributeName);
    }

    /// <summary>
    /// Orders dynamic custom fields using the shared credential presentation contract.
    /// </summary>
    public static List<SSISchemaEntityCustomField> OrderCustomFields(IEnumerable<SSISchemaEntityCustomField> customFields)
    {
      ArgumentNullException.ThrowIfNull(customFields);

      return Order(
        customFields,
        _ => false,
        customField => customField.Group,
        customField => customField.SubGroup,
        customField => customField.SortOrder,
        customField => customField.NameDisplay,
        customField => customField.AttributeName);
    }

    /// <summary>
    /// Orders the consolidated core and custom-field attributes returned by credential wallet detail.
    /// </summary>
    public static List<SSICredentialAttribute> OrderCredentialAttributes(IEnumerable<SSICredentialAttribute> attributes)
    {
      ArgumentNullException.ThrowIfNull(attributes);

      return Order(
        attributes,
        _ => false,
        attribute => attribute.Group,
        attribute => attribute.SubGroup,
        attribute => attribute.SortOrder,
        attribute => attribute.NameDisplay,
        attribute => attribute.Name);
    }

    private static List<T> Order<T>(
      IEnumerable<T> items,
      Func<T, bool> systemSelector,
      Func<T, string?> groupSelector,
      Func<T, string?> subGroupSelector,
      Func<T, int?> sortOrderSelector,
      Func<T, string> displayNameSelector,
      Func<T, string> attributeNameSelector)
    {
      return [.. items
        .Select(item => new
        {
          Item = item,
          System = systemSelector(item),
          Group = groupSelector(item),
          SubGroup = subGroupSelector(item),
          SortOrder = sortOrderSelector(item),
          NameDisplay = displayNameSelector(item),
          AttributeName = attributeNameSelector(item)
        })
        .OrderBy(item => item.System ? 0 : 1)
        .ThenBy(item => string.IsNullOrEmpty(item.Group) ? 1 : 0)
        .ThenBy(item => item.Group)
        .ThenBy(item => item.SubGroup)
        .ThenBy(item => item.SortOrder ?? int.MaxValue)
        .ThenBy(item => item.NameDisplay)
        .ThenBy(item => item.AttributeName)
        .Select(item => item.Item)];
    }
  }
}
