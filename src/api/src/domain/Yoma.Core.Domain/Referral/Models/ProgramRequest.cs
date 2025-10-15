using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramRequestBase
  {
    [Required]
    public string Name { get; set; }

    public string? Description { get; set; }

    public IFormFile? Image { get; set; }

    public int? CompletionWindowInDays { get; set; }

    public int? CompletionLimitReferee { get; set; }

    public int? CompletionLimit { get; set; }

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    [Required]
    public bool ProofOfPersonhoodRequired { get; set; }

    [Required]
    public bool PathwayRequired { get; set; }

    [Required]
    public bool MultipleLinksAllowed { get; set; }

    [Required]
    public bool IsDefault { get; set; }

    [Required]
    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }
  }

  public class ProgramRequestCreate : ProgramRequestBase
  {
    public ProgramPathwayRequestCreate? Pathway { get; set; }
  }

  public class ProgramRequestUpdate : ProgramRequestBase
  {
    [Required]
    public Guid Id { get; set; }

    public ProgramPathwayRequestUpdate? Pathway { get; set; }
  }
}
