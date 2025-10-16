using Newtonsoft.Json;

namespace Yoma.Core.Domain.Entity.Models
{
  public class SettingsInfo
  {
    public List<SettingsInfoItem> Items { get; set; } = null!;
  }

  public class SettingsInfoItem
  {
    public string Key { get; set; } = null!;

    public SettingType Type { get; set; }

    public object Value { get; set; } = null!;

    [JsonIgnore]
    public List<string>? Roles { get; set; }
  }
}
