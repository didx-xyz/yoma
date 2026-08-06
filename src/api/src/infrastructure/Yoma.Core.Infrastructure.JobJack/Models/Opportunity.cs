namespace Yoma.Core.Infrastructure.JobJack.Models
{
  public sealed class Opportunity
  {
    public Guid Id { get; set; }

    public string ExternalId { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Company { get; set; }

    public string? Description { get; set; }

    public string? Requirements { get; set; }

    public string? Location { get; set; }

    public string? City { get; set; }

    public string? Province { get; set; }

    public string? ContractType { get; set; }

    public int? OpportunitiesAvailable { get; set; }

    public string? URL { get; set; }

    public decimal? SalaryLow { get; set; }

    public decimal? SalaryHigh { get; set; }

    public string? SalaryFrequency { get; set; }

    public string? SalaryType { get; set; }

    public string? SalaryAdditional { get; set; }

    public string? Duration { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public DateTimeOffset? EmploymentStartDate { get; set; }

    public string? Category { get; set; }

    public bool? Deleted { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
