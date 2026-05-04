namespace Yoma.Core.Domain.Referral.Models
{
  public sealed class ProgramRewardEstimate
  {
    /// <summary>
    /// Estimated program-level reward payable to the referrer if a referral completion happens now.
    /// Calculated after reserving the referee estimate first.
    /// </summary>
    public decimal? Referrer { get; set; }

    /// <summary>
    /// Estimated program-level reward payable to the referee if a referral completion happens now.
    /// Referee has priority over the referrer when reward pools are capped or partially depleted.
    /// </summary>
    public decimal? Referee { get; set; }

    /// <summary>
    /// Minimum estimated reward payable to the referee from completing the pathway's underlying entities
    /// (i.e. opportunity completion rewards). These are separate from the referral program-level rewards.
    /// Calculated from the shortest/lowest reward route based on the pathway and step completion rules.
    /// </summary>
    public decimal? RefereePathwayMinimum { get; set; }

    /// <summary>
    /// Maximum estimated reward payable to the referee from completing the pathway's underlying entities
    /// (i.e. opportunity completion rewards). These are separate from the referral program-level rewards.
    /// Calculated from the longest/highest reward route based on the pathway and step completion rules.
    /// </summary>
    public decimal? RefereePathwayMaximum { get; set; }

    /// <summary>
    /// Minimum total estimated reward payable to the referee if a referral completion happens now.
    /// Includes the program-level referee estimate plus the minimum pathway reward estimate.
    /// </summary>
    public decimal? RefereeTotalMinimum => Referee.HasValue || RefereePathwayMinimum.HasValue ? (Referee ?? default) + (RefereePathwayMinimum ?? default) : null;

    /// <summary>
    /// Maximum total estimated reward payable to the referee if a referral completion happens now.
    /// Includes the program-level referee estimate plus the maximum pathway reward estimate.
    /// </summary>
    public decimal? RefereeTotalMaximum => Referee.HasValue || RefereePathwayMaximum.HasValue ? (Referee ?? default) + (RefereePathwayMaximum ?? default) : null;
  }
}
