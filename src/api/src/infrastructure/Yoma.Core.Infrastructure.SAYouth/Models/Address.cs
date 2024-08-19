using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  public class Address
  {
    [JsonProperty("address_name")]
    public string AddressName { get; set; }

    [JsonProperty("address_line_1")]
    public string? AddressLine1 { get; set; }

    [JsonProperty("suburb_name")]
    public string SuburbName { get; set; }

    [JsonProperty("city_name")]
    public string? CityName { get; set; }

    [JsonProperty("postal_code")]
    public string? PostalCode { get; set; }

    [JsonProperty("province")]
    public string? Province { get; set; }
  }
}
