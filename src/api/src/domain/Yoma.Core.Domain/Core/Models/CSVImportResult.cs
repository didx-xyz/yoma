namespace Yoma.Core.Domain.Core.Models
{
  public class CSVImportResult
  {
    public bool Succeeded { get; set; }

    public int RowsTotal { get; set; }

    public int RowsSucceeded { get; set; }

    public int RowsFailed { get; set; }

    public List<CSVImportError>? Errors { get; set; }
  }
}
