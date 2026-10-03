namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityCountry
  {
    public Guid Id { get; set; }

    public Guid OpportunityId { get; set; }

    public Guid OpportunityStatusId { get; set; }

    public DateTimeOffset OpportunityDateStart { get; set; }

    public DateTimeOffset? OpportunityDateEnd { get; set; }

    public bool? OpportunityHidden { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid OrganizationStatusId { get; set; }

    public Guid CountryId { get; set; }

    public string CountryName { get; set; } = null!;

    public string? Region { get; set; }

    public string? City { get; set; }

    public double[]? Coordinates { get; set; }

    [Newtonsoft.Json.JsonIgnore]
    public bool HasCoordinates { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
