namespace Yoma.Core.Domain.Core.Models
{
  public sealed class CustomFieldOption
  {
    public Guid Id { get; set; }

    public Guid CustomFieldDefinitionId { get; set; }

    public string Key { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
