using Newtonsoft.Json;

namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? ImageURL { get; set; }

    public int? CompletionWindowInDays { get; set; }

    public int? CompletionLimitReferee { get; set; }

    public int? CompletionLimit { get; set; }

    public int? CompletionTotal { get; set; }

    public int? CompletionBalance => CompletionLimit.HasValue ? CompletionLimit - (CompletionTotal ?? default) : null;

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance => ZltoRewardPool.HasValue? ZltoRewardPool - (ZltoRewardCumulative ?? default) : null;

    public bool ProofOfPersonhoodRequired { get; set; }

    public bool PathwayRequired { get; set; }

    [JsonIgnore]
    public bool MultipleLinksAllowed { get; set; }

    public ProgramStatus Status { get; set; }

    public bool IsDefault { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public ProgramPathwayInfo? Pathway { get; set; }
  }
}
