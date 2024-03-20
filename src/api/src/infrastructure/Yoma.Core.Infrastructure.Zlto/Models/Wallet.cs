using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace Yoma.Core.Infrastructure.Zlto.Models
{
  public class WalletRequestCreate
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

    [JsonProperty("init_zlto_amount")]
    public int Balance { get; set; }

  }

  public class WalletResponseCreate
  {
    [JsonProperty("account_info")]
    public WalletAccountInfo AccountInfo { get; set; }
  }

  public class WalletAccountInfo
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

  public class WalletResponse
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

  public class WalletResponseSearchVouchers
  {
    [JsonProperty("data")]
    public List<WalletVoucher> Items { get; set; }
  }

  public class WalletVoucher
  {
    [JsonProperty("voucher_id"), Required]
    public string VoucherId { get; set; }

    [JsonProperty("wallet_id"), Required]
    public string WalletId { get; set; }

    [JsonProperty("voucher_name"), Required]
    public string VoucherName { get; set; }

    [JsonProperty("voucher_type"), Required]
    public string VoucherType { get; set; }

    [JsonProperty("voucher_category"), Required]
    public string VoucherCategory { get; set; }

    [JsonProperty("voucher_instructions"), Required]
    public string VoucherInstructions { get; set; }

    [JsonProperty("voucher_code"), Required]
    public string VoucherCode { get; set; }

    [JsonProperty("zlto_amount"), Required]
    public string ZltoAmount { get; set; }

    [JsonProperty("voucher_state"), Required]
    public string VoucherState { get; set; }

    [JsonProperty("last_updated"), Required]
    public string LastUpdated { get; set; }

    [JsonProperty("date_created"), Required]
    public string DateCreated { get; set; }
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
