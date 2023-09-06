using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Runtime.Serialization;

namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public partial class AccountRequestCreate
    {
        [JsonProperty("owner_id")]
        public string OwnerId { get; set; }

        [JsonProperty("owner_origin")]
        public string OwnerOrigin { get; set; }

        [JsonProperty("owner_name")]
        public string OwnerName { get; set; }

        [JsonProperty("user_name")]
        public string UserName { get; set; }

        [JsonProperty("user_password")]
        public string UserPassword { get; set; }
    }

    public class AccountResponseCreateLegacy
    {
        [JsonProperty("legacy_response")]
        public string Legacy_response { get; set; }

        [JsonProperty("msg")]
        public string Msg { get; set; }

        [JsonProperty("detail")]
        public string Detail { get; set; }

        [JsonProperty("wallet_response")]
        public WalletResponse? Wallet_response { get; set; }
    }

    public class WalletResponse
    {
        [JsonProperty("account_info")]
        public AccountInfo? AccountInfo { get; set; }
    }

    public class AccountResponseCreate
    {
        [JsonProperty("account_info")]
        public AccountInfo AccountInfo { get; set; }
    }

    public class AccountInfo
    {
        [JsonProperty("owner_id")]
        public string OwnerId { get; set; }

        [JsonProperty("owner_name")]
        public string OwnerName { get; set; }

        [JsonProperty("wallet_id")]
        public string WalletId { get; set; }

        [JsonProperty("user_password")]
        public string UserPassword { get; set; }

        [JsonProperty("date_created")]
        public DateTime DateCreated { get; set; }

        [JsonProperty("external_account_id")]
        public string ExternalAccountId { get; set; }

        [JsonProperty("owner_origin")]
        public string OwnerOrigin { get; set; }

        [JsonProperty("user_name")]
        public string UserName { get; set; }

        [JsonProperty("last_updated")]
        public DateTime LastUpdated { get; set; }
    }

    public class WalletResponseGet
    {
        [JsonProperty("wallet_id")]
        public string WalletId { get; set; }

        [JsonProperty("wallet_name")]
        public string WalletName { get; set; }

        [JsonProperty("zlto_balance")]
        public decimal ZltoBalance { get; set; }

        [JsonProperty("wallet_state")]
        public int WalletState { get; set; }

        [JsonProperty("wallet_type")]
        public int WalletType { get; set; }

        [JsonProperty("owner_id")]
        public string OwnerId { get; set; }

        [JsonProperty("wallet_owner_type")]
        [JsonConverter(typeof(StringEnumConverter))]
        public WalletOwnerType WalletOwnerType { get; set; }

        [JsonProperty("wallet_location")]
        public string WalletLocation { get; set; }

        [JsonProperty("location_details")]
        public WalletLocation LocationDetails { get; set; }

        [JsonProperty("last_updated")]
        public DateTimeOffset LastUpdated { get; set; }

        [JsonProperty("date_created")]
        public DateTimeOffset DateCreated { get; set; }
    }

    public class WalletLocation
    {
        [JsonProperty("location_id")]
        public int LocationId { get; set; }

        [JsonProperty("location_name")]
        public string LocationName { get; set; }

        [JsonProperty("location_sym")]
        public string LocationSym { get; set; }

        [JsonProperty("zlto_rate")]
        public int ZltoRate { get; set; }

        [JsonProperty("status")]
        public int Status { get; set; }

        [JsonProperty("date_created")]
        public DateTimeOffset DateCreated { get; set; }
    }

    public class WalletResponseBalance
    {
        [JsonProperty("zlto_balance")]
        public decimal ZltoBalance { get; set; }
    }

    public partial class WalletResponseTransactions
    {
        [JsonProperty("wallet_id")]
        public string Wallet_id { get; set; }

        [JsonProperty("limit")]
        public int Limit { get; set; }

        [JsonProperty("offset")]
        public int Offset { get; set; }

        [JsonProperty("data")]
        public ICollection<WalletTransaction>? Items { get; set; }
    }

    public partial class WalletTransaction
    {
        [JsonProperty("transaction_id")]
        public int Transaction_id { get; set; }

        [JsonProperty("wallet_id")]
        public string Wallet_id { get; set; }

        [JsonProperty("owner_id")]
        public string Owner_id { get; set; }

        [JsonProperty("transaction_payload")]
        public string Transaction_payload { get; set; }

        [JsonProperty("transaction_type")]
        public int Transaction_type { get; set; }

        [JsonProperty("transaction_amount")]
        public decimal Transaction_amount { get; set; }

        [JsonProperty("transaction_status")]
        public int Transaction_status { get; set; }

        [JsonProperty("last_updated")]
        public DateTimeOffset Last_updated { get; set; }

        [JsonProperty("date_created")]
        public DateTimeOffset Date_created { get; set; }
    }

    public enum WalletOwnerType
    {
        [EnumMember(Value = @"wallet")]
        Wallet = 0,

        [EnumMember(Value = @"member")]
        Member = 1,

        [EnumMember(Value = @"program")]
        Program = 2,

        [EnumMember(Value = @"external")]
        External = 3,
    }
}
