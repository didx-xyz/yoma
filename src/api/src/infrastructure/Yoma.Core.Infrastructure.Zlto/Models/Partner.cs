using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Runtime.Serialization;

namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public class PartnerResponseLogin
    {
        [JsonProperty("account_info")]
        public string AccessToken { get; set; }

        [JsonProperty("account_info")]
        public PartnerAccount AccountInfo { get; set; }
    }

    public class PartnerAccount
    {
        [JsonProperty("partner_name")]
        public string PartnerName { get; set; }

        [JsonProperty("partner_username")]
        public string PartnerUsername { get; set; }

        [JsonProperty("partner_type")]
        public int PartnerType { get; set; }

        [JsonProperty("last_login")]
        public DateTime LastLogin { get; set; }

        [JsonProperty("partner_password")]
        public string PartnerPassword { get; set; }

        [JsonProperty("partner_id")]
        public string PartnerId { get; set; }

        [JsonProperty("partner_status")]
        [JsonConverter(typeof(StringEnumConverter))]
        public PartnerAccountStatus PartnerStatus { get; set; }
    }

    public class PartnerRequestLogin
    {
        [JsonProperty("partner_username")]
        public string PartnerUsername { get; set; }

        [JsonProperty("partner_password")]
        public string PartnerPassword { get; set; }
    }

    public enum PartnerAccountStatus
    {
        [EnumMember(Value = @"new")]
        New = 0,

        [EnumMember(Value = @"legacy")]
        Legacy = 1,

        [EnumMember(Value = @"active")]
        Active = 2,

        [EnumMember(Value = @"verified")]
        Verified = 3,

        [EnumMember(Value = @"demo")]
        Demo = 4,

        [EnumMember(Value = @"ban")]
        Ban = 5
    }
}

