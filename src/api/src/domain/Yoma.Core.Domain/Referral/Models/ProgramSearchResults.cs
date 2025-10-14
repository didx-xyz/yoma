namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramSearchResults
  {
    public int? TotalCount { get; set; }

    public List<ProgramItem> Items { get; set; }
  }
}
