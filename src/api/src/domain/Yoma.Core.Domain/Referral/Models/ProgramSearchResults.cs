namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramSearchResults
  {
    public int? TotalCount { get; set; }

    public List<ProgramInfo> Items { get; set; }
  }
}
