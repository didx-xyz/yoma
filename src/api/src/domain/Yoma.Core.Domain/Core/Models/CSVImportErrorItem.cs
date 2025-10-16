namespace Yoma.Core.Domain.Core.Models
{
  public class CSVImportErrorItem
  {
    public CSVImportErrorType Type { get; set; }

    public string TypeDescription { get; set; } = null!;

    public string Message { get; set; } = null!;

    public string? Field { get; set; }

    public string? Value { get; set; }
  }
}
