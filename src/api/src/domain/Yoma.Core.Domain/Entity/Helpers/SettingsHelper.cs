using FluentValidation;
using Newtonsoft.Json;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Models.Lookups;

namespace Yoma.Core.Domain.Entity.Helpers
{
  public static class SettingsHelper
  {
    #region Public Members
    public static Dictionary<string, object>? ToDictionary(string? settings)
    {
      settings = settings?.Trim();
      if (string.IsNullOrEmpty(settings)) return null;

      return JsonConvert.DeserializeObject<Dictionary<string, object>>(settings);
    }

    public static Settings Parse(List<SettingsDefinition> definitions, string? settingsRaw)
    {
      if (definitions == null || definitions.Count == 0)
        throw new ArgumentNullException(nameof(definitions));

      var settings = ToDictionary(settingsRaw);

      var settingsDictionary = new Dictionary<string, SettingItem>();

      foreach (var definition in definitions)
      {
        if (settings == null || !settings.TryGetValue(definition.Key, out object? value))
          value = ParseValue(definition.Type, definition.DefaultValue);

        settingsDictionary[definition.Key] = new SettingItem
        {
          Key = definition.Key,
          Title = definition.Title,
          Description = definition.Description,
          Type = definition.Type,
          Value = value,
          Enabled = definition.Enabled,
          Visible = definition.Visible,
          Roles = definition.Roles
        };
      }

      var groupedSettings = definitions
          .GroupBy(d => d.Group)
          .Select(g => new SettingGroup
          {
            Group = g.Key,
            Items = [.. g.Where(d => string.IsNullOrEmpty(d.SubGroup))
                       .OrderBy(d => d.Order)
                       .Select(d => settingsDictionary[d.Key])],
            Groups = [.. g.Where(d => !string.IsNullOrEmpty(d.SubGroup))
                        .GroupBy(d => d.SubGroup)
                        .Select(subGroup => new SettingGroup
                        {
                          Group = subGroup.Key ?? string.Empty,
                          Items = [.. subGroup.OrderBy(d => d.Order).Select(d => settingsDictionary[d.Key])]
                        })
                        .OrderBy(subGroup => subGroup.Items != null && subGroup.Items.Count != 0 ? subGroup.Items.Min(i => definitions.First(d => d.Key == i.Key).Order) : int.MaxValue)]
          })
          .OrderBy(g =>
          {
            if (g.Items != null && g.Items.Count > 0)
            {
              return OrderByGetMinOrder(g.Items, definitions);
            }
            else if (g.Groups != null && g.Groups.Count > 0)
            {
              return g.Groups.Min(subGroup =>
              {
                if (subGroup.Items != null && subGroup.Items.Count > 0)
                {
                  return OrderByGetMinOrder(subGroup.Items, definitions);
                }
                return int.MaxValue;
              });
            }
            return int.MaxValue;
          })
          .ToList();

      foreach (var group in groupedSettings)
      {
        if (group.Items == null || group.Items.Count == 0)
          group.Items = null;

        if (group.Groups == null || group.Groups.Count == 0)
        {
          group.Groups = null;
        }
        else
        {
          foreach (var subgroup in group.Groups)
          {
            if (subgroup.Items == null || subgroup.Items.Count == 0)
              subgroup.Items = null;

            subgroup.Groups = null;
          }

          if (group.Groups.All(subGroup => subGroup.Items == null))
            group.Groups = null;
        }
      }

      return new Settings { Groups = groupedSettings };
    }

    public static SettingsInfo ParseInfo(List<SettingsDefinition> definitions, string? settingsRaw)
    {
      if (definitions == null || definitions.Count == 0)
        throw new ArgumentNullException(nameof(definitions));

      var settings = ToDictionary(settingsRaw);

      return ParseInfo(definitions, settings);
    }

    public static SettingsInfo ParseInfo(List<SettingsDefinition> definitions, Dictionary<string, object>? settings)
    {
      if (definitions == null || definitions.Count == 0)
        throw new ArgumentNullException(nameof(definitions));

      var settingsInfoItems = new List<SettingsInfoItem>();

      foreach (var definition in definitions)
      {
        if (settings == null || !settings.TryGetValue(definition.Key, out object? value))
          value = ParseValue(definition.Type, definition.DefaultValue);

        settingsInfoItems.Add(new SettingsInfoItem
        {
          Key = definition.Key,
          Type = definition.Type,
          Value = value,
          Roles = definition.Roles
        });
      }

      return new SettingsInfo { Items = settingsInfoItems };
    }

    public static void Validate(List<SettingsDefinition> definitions,
      List<string>? roles,
      Dictionary<string, object> settingsUpdated,
      Dictionary<string, object>? settingsCurrent)
    {
      if (definitions == null || definitions.Count == 0)
        throw new ArgumentNullException(nameof(definitions));

      ArgumentNullException.ThrowIfNull(settingsUpdated, nameof(settingsUpdated));
      if (settingsUpdated.Count == 0) return;

      var definitionsDict = definitions.ToDictionary(d => d.Key, d => d);

      foreach (var setting in settingsUpdated)
      {
        if (!definitionsDict.TryGetValue(setting.Key, out var definition))
          throw new ValidationException($"Setting '{setting.Key}' is invalid / undefined");

        if (!IsValidType(definition.Type, setting.Value))
          throw new ValidationException($"Setting '{setting.Key}' has an invalid value. Value of type '{definition.Type}' expected");

        if (roles == null) continue;
        if (definition.Roles == null || definition.Roles.Count == 0) continue;
        if (!definition.Roles.Intersect(roles).Any())
          throw new ValidationException($"Setting '{setting.Key}' is not supported based on the current user roles");

        if (definition.Enabled) continue;
        if (settingsCurrent == null) continue;

        if (settingsCurrent.TryGetValue(setting.Key, out var currentValue) && !Equals(currentValue, setting.Value))
          throw new ValidationException($"Setting '{setting.Key}' cannot be changed as it is not enabled");
      }
    }

    public static Settings FilterByRoles(Settings settings, List<string> roles)
    {
      ArgumentNullException.ThrowIfNull(settings);

      ArgumentNullException.ThrowIfNull(roles, nameof(roles));

      return new Settings
      {
        Groups = [.. settings.Groups
              .Select(group => new SettingGroup
              {
                Group = group.Group,
                Items = group.Items?
                      .Where(item => item.Roles == null || item.Roles.Count == 0 || item.Roles.Intersect(roles).Any())
                      .ToList(),
                Groups = group.Groups?
                      .Select(subgroup => new SettingGroup
                      {
                        Group = subgroup.Group,
                        Items = subgroup.Items?
                              .Where(item => item.Roles == null || item.Roles.Count == 0 || item.Roles.Intersect(roles).Any())
                              .ToList(),
                        Groups = null
                      })
                      .Where(subgroup => subgroup.Items != null && subgroup.Items.Count > 0)
                      .ToList()
              })
              .Where(group => (group.Items != null && group.Items.Count > 0) ||
                              (group.Groups != null && group.Groups.Count > 0))]
      };
    }

    public static SettingsInfo? FilterByRoles(SettingsInfo? settingsInfo, List<string> roles)
    {
      if (settingsInfo == null) return null;

      ArgumentNullException.ThrowIfNull(roles, nameof(roles));

      return new SettingsInfo
      {
        Items = [.. settingsInfo.Items.Where(item => item.Roles == null || item.Roles.Intersect(roles).Any())]
      };
    }

    public static T? GetValue<T>(Settings? settings, string key)
        where T : struct
    {
      if (settings == null) return null;

      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = key.Trim();

      var allItems = settings.Groups
          .SelectMany(group =>
          {
            var items = group.Items ?? Enumerable.Empty<SettingItem>();
            if (group.Groups != null)
            {
              items = items.Concat(group.Groups.SelectMany(subgroup =>
                  subgroup.Items ?? Enumerable.Empty<SettingItem>()));
            }
            return items;
          })
          .ToList();

      var settingItem = allItems.SingleOrDefault(s => s.Key == key);

      if (settingItem == null) return null;

      if (!IsValidType(settingItem.Type, settingItem.Value))
        throw new InvalidCastException($"Setting '{key}' is not of type '{typeof(T).Name}'");

      try
      {
        return (T)Convert.ChangeType(settingItem.Value, typeof(T));
      }
      catch (Exception ex)
      {
        throw new InvalidCastException($"Failed to cast setting '{key}' value to type '{typeof(T).Name}'", ex);
      }
    }

    public static T? GetValue<T>(SettingsInfo? settingsInfo, string key)
      where T : struct
    {
      if (settingsInfo == null) return null;

      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = key.Trim();

      var settingItem = settingsInfo.Items.SingleOrDefault(s => s.Key == key);

      if (settingItem == null) return null;

      if (!IsValidType(settingItem.Type, settingItem.Value))
        throw new InvalidCastException($"Setting '{key}' is not of type '{typeof(T).Name}'");

      try
      {
        return (T)Convert.ChangeType(settingItem.Value, typeof(T));
      }
      catch (Exception ex)
      {
        throw new InvalidCastException($"Failed to cast setting '{key}' value to type '{typeof(T).Name}'", ex);
      }
    }
    #endregion

    #region Private Members
    private static int OrderByGetMinOrder(IEnumerable<SettingItem> items, IEnumerable<SettingsDefinition> definitions)
    {
      return items.Min(i => definitions.First(d => d.Key == i.Key).Order);
    }

    private static object ParseValue(SettingType type, string value)
    {
      return type switch
      {
        SettingType.Boolean => bool.Parse(value),
        SettingType.Number => double.Parse(value),
        SettingType.String => value,
        _ => throw new InvalidOperationException($"Unsupported type: {type}")
      };
    }

    private static bool IsValidType(SettingType type, object value)
    {
      if (value == null) return false;

      return type switch
      {
        SettingType.Boolean => value is bool,
        SettingType.Number => value is int || value is float || value is double || value is decimal,
        SettingType.String => value is string,
        _ => false
      };
    }
    #endregion
  }
}
