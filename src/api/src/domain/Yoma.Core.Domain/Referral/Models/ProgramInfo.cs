namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public string? ImageURL { get; set; }

    public int? CompletionWindowInDays { get; set; }

    public int? CompletionLimitReferee { get; set; }

    public int? CompletionLimit { get; set; }

    public int? CompletionTotal { get; set; }

    public int? CompletionBalance { get; set; }

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance { get; set; }

    public bool ProofOfPersonhoodRequired { get; set; }

    public bool PathwayRequired { get; set; }

    public ProgramStatus Status { get; set; }

    public bool IsDefault { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public ProgramPathwayInfo? Pathway { get; set; }
  }
}
