using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunityCountries", Schema = "Opportunity")]
  [Index(nameof(OpportunityId), nameof(CountryId), IsUnique = true)]
  public class OpportunityCountry : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; } = null!;

    [Required]
    [ForeignKey("CountryId")]
    public Guid CountryId { get; set; }
    public Country Country { get; set; } = null!;

    [Column(TypeName = "varchar(255)")]
    public string? Region { get; set; }

    [Column(TypeName = "varchar(255)")]
    public string? City { get; set; }

    // WGS84 point, consistent with user location storage; geography supports distances in metres.
    [Column(TypeName = "geography (point, 4326)")]
    public NetTopologySuite.Geometries.Point? Coordinates { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
