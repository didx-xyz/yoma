using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.JobJack.Entities
{
  [Table("Opportunity", Schema = "JobJack")]
  [Index(nameof(ExternalId), IsUnique = true)]
  [Index(nameof(Deleted), nameof(DateModified))]
  public sealed class Opportunity : BaseEntity<Guid>
  {
    [Required, Column(TypeName = "varchar(50)")]
    public string ExternalId { get; set; } = null!;

    [Required, Column(TypeName = "varchar(512)")]
    public string Title { get; set; } = null!;

    [Column(TypeName = "varchar(256)")]
    public string? Company { get; set; }

    [Column(TypeName = "text")]
    public string? Description { get; set; }

    [Column(TypeName = "text")]
    public string? Requirements { get; set; }

    [Column(TypeName = "varchar(512)")]
    public string? Location { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? City { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? Province { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? ContractType { get; set; }

    public int? OpportunitiesAvailable { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? URL { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? SalaryLow { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? SalaryHigh { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? SalaryFrequency { get; set; }

    [Column(TypeName = "varchar(256)")]
    public string? SalaryType { get; set; }

    [Column(TypeName = "varchar(512)")]
    public string? SalaryAdditional { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? Duration { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public DateTimeOffset? EmploymentStartDate { get; set; }

    [Column(TypeName = "varchar(512)")]
    public string? Category { get; set; }

    public bool? Deleted { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
