namespace Yoma.Core.Domain.Core.Models
{
  public class CSVImportError
  {
    public int? Row { get; set; }

    public CSVImportErrorType Type { get; set; }

    public string Message { get; set; }

    public string? Field { get; set; }

    public string? Value { get; set; }
  }
}
