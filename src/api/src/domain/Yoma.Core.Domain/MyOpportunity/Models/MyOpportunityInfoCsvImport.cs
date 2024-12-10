using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityInfoCsvImport
  {
    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public string? Gender { get; set; }

    public string? Country { get; set; }

    [Required]
    public string OpporunityExternalId { get; set; }
  }
}
