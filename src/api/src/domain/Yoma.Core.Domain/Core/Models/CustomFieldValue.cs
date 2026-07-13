namespace Yoma.Core.Domain.Core.Models
{
  public sealed class CustomFieldValue
  {
    public const char Value_Delimiter = '|';

    public Guid Id { get; set; }

    public Guid CustomFieldDefinitionId { get; set; }

    public Guid? OpportunityId { get; set; }

    public Guid? MyOpportunityId { get; set; }

    /// <summary>
    /// Canonical text value for the field data type. Option fields store the option key.
    /// </summary>
    public string Value { get; set; } = null!;

    /// <summary>
    /// Helper for multi-select option values. Values are stored in <see cref="Value"/> as pipe-delimited option keys
    /// with leading and trailing delimiters, e.g. "|Remote|Hybrid|", so exact option filtering can use Contains("|Hybrid|").
    /// Empty entries are removed when splitting because the leading and trailing delimiters intentionally create empty segments.
    /// </summary>
    public List<string>? Values
    {
      get => string.IsNullOrWhiteSpace(Value)
        ? null
        : [.. Value.Split(Value_Delimiter, StringSplitOptions.RemoveEmptyEntries).Select(o => o.Trim())];

      set => Value = value == null || value.Count == 0
        ? null!
        : $"{Value_Delimiter}{string.Join(Value_Delimiter, value.Select(o => o.Trim()).Distinct())}{Value_Delimiter}";
    }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
