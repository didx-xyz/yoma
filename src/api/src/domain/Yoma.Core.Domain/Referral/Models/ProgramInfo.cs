using Newtonsoft.Json;
using Yoma.Core.Domain.Lookups.Models;

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

    /// <summary>
    /// ZLTO amount for the referrer, read at completion time (not at claim).
    /// null = no program override (system default or 0).
    /// </summary>
    public decimal? ZltoRewardReferrer { get; set; }

    /// <summary>
    /// ZLTO amount for the referee, read at completion time (not at claim).
    /// null = no program override (system default or 0).
    /// </summary>
    public decimal? ZltoRewardReferee { get; set; }

    [JsonIgnore]
    public decimal? ZltoRewardPool { get; set; }

    /// <summary>
    /// Total cumulative ZLTO reward generated across the entire referral program.
    /// This represents the combined ZLTO awarded for all links and all usages within
    /// the program:
    /// - ZLTO paid to referrers for all referee completions
    /// - Plus ZLTO paid to all referees for their own completions
    ///
    /// Calculated from the sum of all (rewardReferrer + rewardReferee) values across
    /// every processed usage belonging to any link in this program. This is a
    /// program-level aggregated total and not role-specific.
    /// </summary>
    public decimal? ZltoRewardCumulative { get; set; }

    [JsonIgnore]
    public decimal? ZltoRewardBalance => ZltoRewardPool.HasValue ? ZltoRewardPool - (ZltoRewardCumulative ?? default) : null;

    public bool ProofOfPersonhoodRequired { get; set; }

    public bool PathwayRequired { get; set; }

    [JsonIgnore]
    public bool MultipleLinksAllowed { get; set; }

    public ProgramStatus Status { get; set; }

    public bool IsDefault { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public ProgramPathwayInfo? Pathway { get; set; }

    public List<Country>? Countries { get; set; }
  }
}
