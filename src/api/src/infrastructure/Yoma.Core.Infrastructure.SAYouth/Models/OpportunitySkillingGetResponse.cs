using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  public class OpportunitySkillingGetResponse
  {
    [JsonProperty("opportunityId")]
    public int OpportunityId { get; set; }

    [JsonProperty("reference_number")]
    public string? ReferenceNumber { get; set; }

    [JsonProperty("company_name")]
    public string? CompanyName { get; set; }

    [JsonProperty("sponsoring_partner")]
    public string? SponsoringPartner { get; set; }

    [JsonProperty("title")]
    public string? Title { get; set; }

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("duration")]
    public string? Duration { get; set; }

    [JsonProperty("date_received")]
    public string? DateReceived { get; set; }

    [JsonProperty("closing_date")]
    public string? ClosingDate { get; set; }

    [JsonProperty("location")]
    public string? Location { get; set; }

    [JsonProperty("is_online")]
    public bool? IsOnline { get; set; }

    [JsonProperty("url")]
    public string? Url { get; set; }

    [JsonProperty("requirements")]
    public string? Requirements { get; set; }

    [JsonProperty("certification_description")]
    public string? CertificationDescription { get; set; }

    [JsonProperty("certification_type")]
    public string? CertificationType { get; set; }

    [JsonProperty("province")]
    public string? Province { get; set; }

    [JsonProperty("city")]
    public string? City { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }
  }
}
