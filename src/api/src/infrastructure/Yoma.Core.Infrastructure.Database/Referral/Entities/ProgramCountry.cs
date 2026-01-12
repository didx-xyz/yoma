using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("ProgramCountries", Schema = "Referral")]
  [Index(nameof(ProgramId), nameof(CountryId), IsUnique = true)]
  public class ProgramCountry : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("ProgramId")]
    public Guid ProgramId { get; set; }
    public Program Program { get; set; } = null!;

    [Required]
    [ForeignKey("CountryId")]
    public Guid CountryId { get; set; }
    public Country Country { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
