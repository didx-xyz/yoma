namespace Yoma.Core.Domain.Core.Models
{
  public class CSVImportErrorRow
  {
    public int? Number { get; set; }

    public string Alias => !Number.HasValue ? "Unknown" : Number.Value == 1 ? "Header" : "Record";

    public List<CSVImportErrorItem> Items { get; set; }
  }
}
