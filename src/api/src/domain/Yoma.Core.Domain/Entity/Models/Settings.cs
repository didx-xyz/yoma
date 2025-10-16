using Newtonsoft.Json;

namespace Yoma.Core.Domain.Entity.Models
{
  public class Settings
  {
    public List<SettingGroup> Groups { get; set; } = null!;
  }

  public class SettingGroup
  {
    public string Group { get; set; } = null!;

    public List<SettingItem>? Items { get; set; }

    public List<SettingGroup>? Groups { get; set; }
  }

  public class SettingItem
  {
    public string Key { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public SettingType Type { get; set; }

    public bool Enabled { get; set; }

    public bool Visible { get; set; }

    public object Value { get; set; } = null!;

    [JsonIgnore]
    public List<string>? Roles { get; set; }
  }
}
