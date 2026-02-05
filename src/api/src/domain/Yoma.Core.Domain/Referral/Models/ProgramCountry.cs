namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramCountry
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public Guid ProgramStatusId { get; set; }

    public DateTimeOffset ProgramDateStart { get; set; }

    public Guid CountryId { get; set; }

    public string CountryName { get; set; } = null!;

    public DateTimeOffset DateCreated { get; set; }
  }
}
