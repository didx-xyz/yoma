using Newtonsoft.Json;

namespace Yoma.Core.Domain.Entity.Models
{
  public class SettingsInfo
  {
    public List<SettingsInfoItem> Items { get; set; }
  }

  public class SettingsInfoItem
  {
    public string Key { get; set; }

    public SettingType Type { get; set; }

    public object Value { get; set; }

    [JsonIgnore]
    public List<string> Roles { get; set; }
  }
}
