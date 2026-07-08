namespace Yoma.Core.Domain.Core.Models
{
  public sealed class CustomFieldValueRequest
  {
    public string Key { get; set; } = null!;

    public string? Value { get; set; }

    public List<string>? Values { get; set; }
  }
}
