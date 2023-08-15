using Newtonsoft.Json;

namespace Yoma.Core.Domain.EmailProvider.Models
{
  public class EmailOrganizationApprovedData : EmailDataBase
  {
    [JsonProperty("OrganisationName")]
    public string PrimaryContact { get; set; }
  }
}
