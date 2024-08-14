using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  internal class OpportunitySkillingUpsertRequest
  {
    [JsonProperty("learning_opportunity_holder")]
    public string Holder { get; set; }

    [JsonProperty("learning_opportunity_sponsoring_partner")]
    public string? SponsoringPartner { get; set; }

    [JsonProperty("learning_opportunity_title")]
    public string Title { get; set; }

    [JsonProperty("learning_opportunity_description")]
    public string Description { get; set; }

    [JsonProperty("learning_opportunity_has_certification")]
    [JsonConverter(typeof(StringEnumConverter))]
    public YesNoOption HasCertification { get; set; }

    [JsonProperty("learning_opportunity_certification_type")]
    public string? CertificationType { get; set; }

    [JsonProperty("learning_opportunity_certification_description")]
    public string? CertificationDescription { get; set; }

    [JsonProperty("learning_opportunity_close_date")]
    [JsonConverter(typeof(IsoDateTimeConverter), "yyyy-MM-dd")]
    public DateTimeOffset? CloseDate { get; set; }

    [JsonProperty("learning_opportunity_duration")]
    [JsonConverter(typeof(StringEnumConverter))]
    public Duration? Duration { get; set; }

    [JsonProperty("learning_opportunity_requirements")]
    public string Requirements { get; set; }

    [JsonProperty("learning_opportunity_face_to_face")]
    [JsonConverter(typeof(StringEnumConverter))]
    public YesNoOption FaceToFace { get; set; }

    [JsonProperty("learning_opportunity_address")]
    public Address? Address { get; set; }

    [JsonProperty("learning_address_contact")]
    public Contact? Contact { get; set; }

    [JsonProperty("learning_opportunity_url")]
    public string? Url { get; set; }
  }
}
