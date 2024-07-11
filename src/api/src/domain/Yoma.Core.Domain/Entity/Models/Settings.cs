using Newtonsoft.Json;

namespace Yoma.Core.Domain.Entity.Models
{
  public class Settings
  {
    public List<SettingGroup> Groups { get; set; }
  }

  public class SettingGroup
  {
    public string Group { get; set; }

    public List<SettingItem>? Items { get; set; }

    public List<SettingGroup>? Groups { get; set; }
  }

  public class SettingItem
  {
    public string Key { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public SettingType Type { get; set; }

    public bool Enabled { get; set; }

    public object Value { get; set; }

    [JsonIgnore]
    public List<string> Roles { get; set; }
  }
}
