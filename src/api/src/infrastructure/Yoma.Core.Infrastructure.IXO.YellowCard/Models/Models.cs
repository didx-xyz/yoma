using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Models
{
  #region Authentication
  public sealed class AccessTokenRequest
  {
    [JsonProperty("client_id")]
    public string ClientId { get; set; } = null!;

    [JsonProperty("client_secret")]
    public string ClientSecret { get; set; } = null!;

    [JsonProperty("grant_type")]
    public string GrantType { get; set; } = "client_credentials";
  }

  public sealed class AccessTokenResponse
  {
    [JsonProperty("access_token")]
    public string AccessToken { get; set; } = null!;

    [JsonProperty("token_type")]
    public string TokenType { get; set; } = null!;

    [JsonProperty("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonIgnore]
    public DateTimeOffset DateIssued { get; } = DateTimeOffset.UtcNow;

    [JsonIgnore]
    public DateTimeOffset DateExpire => DateIssued.AddSeconds(Math.Max(ExpiresIn - 5, 0));
  }
  #endregion

  #region Payouts
  public sealed class YellowCardPayoutRequest
  {
    [JsonProperty("yomaTransactionId")]
    public string YomaTransactionId { get; set; } = null!;

    [JsonProperty("yomaUserId")]
    public string YomaUserId { get; set; } = null!;

    [JsonProperty("amountInUSD")]
    public decimal AmountInUSD { get; set; }

    [JsonProperty("firstName")]
    public string FirstName { get; set; } = null!;

    [JsonProperty("surname")]
    public string Surname { get; set; } = null!;

    [JsonProperty("country")]
    public string Country { get; set; } = null!;

    [JsonProperty("gender")]
    public string Gender { get; set; } = null!;

    [JsonProperty("dateOfBirth")]
    public string DateOfBirth { get; set; } = null!;

    [JsonProperty("username")]
    public string Username { get; set; } = null!;

    [JsonProperty("email")]
    public string? Email { get; set; }

    [JsonProperty("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [JsonProperty("educationLevel")]
    public string? EducationLevel { get; set; }
  }

  public sealed class YellowCardPayoutSessionResponse
  {
    [JsonProperty("providerTransactionId")]
    public string ProviderTransactionId { get; set; } = null!;

    [JsonProperty("paymentUrl")]
    public string PaymentUrl { get; set; } = null!;

    [JsonProperty("expiresAt")]
    public string ExpiresAt { get; set; } = null!;

    [JsonProperty("status")]
    public string Status { get; set; } = null!;
  }

  public sealed class YellowCardPayoutStatusResponse
  {
    [JsonProperty("yomaTransactionId")]
    public string YomaTransactionId { get; set; } = null!;

    [JsonProperty("providerTransactionId")]
    public string ProviderTransactionId { get; set; } = null!;

    [JsonProperty("status")]
    public string Status { get; set; } = null!;

    [JsonProperty("errorReason")]
    public string? ErrorReason { get; set; }

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; } = null!;

    [JsonProperty("updatedAt")]
    public string UpdatedAt { get; set; } = null!;
  }

  public sealed class YellowCardErrorResponse
  {
    [JsonProperty("error")]
    public string? Error { get; set; }

    [JsonProperty("message")]
    public string? Message { get; set; }

    [JsonProperty("status")]
    public int Status { get; set; }

    [JsonProperty("code")]
    public string? Code { get; set; }
  }
  #endregion
}
