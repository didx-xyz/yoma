namespace Yoma.Core.Domain.Core.Models
{
  public class CSVImportErrorItem
  {
    public CSVImportErrorType Type { get; set; }

    public string TypeDescription { get; set; }

    public string Message { get; set; }

    public string? Field { get; set; }

    public string? Value { get; set; }
  }
}
