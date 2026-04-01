namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramCountry
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public Guid ProgramStatusId { get; set; }

    public DateTimeOffset ProgramDateStart { get; set; }

    public bool? ProgramHidden { get; set; }

    public int? ProgramReferrerLimit { get; set; }

    public int? ProgramReferrerTotal { get; set; }

    public bool ProgramMultipleLinksAllowed { get; set; }

    public Guid CountryId { get; set; }

    public string CountryName { get; set; } = null!;

    public DateTimeOffset DateCreated { get; set; }
  }
}
