namespace Yoma.Core.Domain.Core.Models
{
  public class CSVImportResult
  {
    public bool Imported { get; set; }

    public bool HeaderErrors { get; set; }

    public int RecordsTotal { get; set; }

    public int RecordsSucceeded { get; set; }

    public int RecordsFailed { get; set; }

    public List<CSVImportErrorRow>? Errors { get; set; }
  }
}
