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

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public bool ProofOfPersonhoodRequired { get; set; }

    public bool PathwaysRequired { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public ProgramPathwayInfo? Pathway { get; set; }

    #region Referee Status
    public LinkUsageStatus? LinkUsageStatus { get; set; }

    public DateTimeOffset? DateClaimed { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public bool? ProofOfPersonhoodCompleted { get; set; }

    public ProofOfPersonhoodMethod? ProofOfPersonhoodMethod { get; set; }

    public bool? PathwaysCompleted { get; set; }
    #endregion
  }
}
