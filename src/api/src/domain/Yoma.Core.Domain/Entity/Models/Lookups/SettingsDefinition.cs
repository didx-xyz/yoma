namespace Yoma.Core.Domain.Entity.Models.Lookups
{
  public class SettingsDefinition
  {
    public Guid Id { get; set; }

    public EntityType EntityType { get; set; }

    public string Key { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Group { get; set; } = null!;

    public string? SubGroup { get; set; }

    public short Order { get; set; }

    public List<string>? Roles { get; set; }

    public string DefaultValue { get; set; } = null!;

    public SettingType Type { get; set; }

    public bool Enabled { get; set; }

    public bool Visible { get; set; }
  }
}
