using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// didx:me wallet response. ProviderClient resolves its vct through the preset mapping and
  /// projects the signed claims into Yoma's existing credential contract.
  /// Preserve typed claims instead of silently flattening or converting SD-JWT values to strings.
  /// </summary>
  public class WalletCredential
  {
    public string Id { get; set; } = null!;

    public string Format { get; set; } = null!;

    public string Vct { get; set; } = null!;

    public string Status { get; set; } = null!;

    [JsonProperty("iat")]
    public DateTimeOffset? DateIssued { get; set; }

    /// <summary>
    /// Optional signed credential expiry returned by the provider; absent means no expiry is declared.
    /// </summary>
    [JsonProperty("exp")]
    public DateTimeOffset? DateExpire { get; set; }

    public JObject Claims { get; set; } = null!;
  }
}
