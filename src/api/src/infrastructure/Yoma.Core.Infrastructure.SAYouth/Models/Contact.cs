using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  public class Contact
  {
    [JsonProperty("first_name")]
    public string? FirstName { get; set; }

    [JsonProperty("surname")]
    public string? Surname { get; set; }

    [JsonProperty("email_address")]
    public string? EmailAddress { get; set; }

    [JsonProperty("phone_number")]
    public string? PhoneNumber { get; set; }
  }
}
