namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramSearchResultsBase
  {
    public int? TotalCount { get; set; }
  }

  public class ProgramSearchResults : ProgramSearchResultsBase
  {
    public List<Program>? Items { get; set; }
  }

  public class ProgramSearchResultsInfo : ProgramSearchResultsBase
  {
    public List<ProgramInfo>? Items { get; set; }
  }
}
