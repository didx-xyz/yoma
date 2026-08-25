using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Converters;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Models
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

  #region Pagination
  public class PageResponse<TItem>
  {
    [JsonProperty("page")]
    public int Page { get; set; }

    [JsonProperty("pageSize")]
    public int PageSize { get; set; }

    [JsonProperty("totalPages")]
    public int TotalPages { get; set; }

    [JsonProperty("items")]
    public List<TItem> Items { get; set; } = [];
  }
  #endregion

  #region Opportunities
  public sealed class OpportunityResponse
  {
    [JsonProperty("externalId")]
    public string ExternalId { get; set; } = null!;

    [JsonProperty("type")]
    public string Type { get; set; } = null!;

    [JsonProperty("title")]
    public string Title { get; set; } = null!;

    [JsonProperty("url")]
    public string URL { get; set; } = null!;

    [JsonProperty("startDate")]
    [JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset StartDate { get; set; }

    [JsonProperty("endDate")]
    [JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? EndDate { get; set; }

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("summary")]
    public string? Summary { get; set; }

    [JsonProperty("provider")]
    public string? Provider { get; set; }

    [JsonProperty("categories")]
    public List<string> Categories { get; set; } = [];

    [JsonProperty("countries")]
    public List<string> Countries { get; set; } = [];

    [JsonProperty("languages")]
    public List<string> Languages { get; set; } = [];

    [JsonProperty("removed")]
    public bool? Removed { get; set; }

    [JsonProperty("commitment")]
    public Commitment? Commitment { get; set; }

    [JsonProperty("skills")]
    public List<string> Skills { get; set; } = [];

    [JsonProperty("keywords")]
    public List<string> Keywords { get; set; } = [];

    [JsonProperty("difficulty")]
    public string? Difficulty { get; set; }

    [JsonProperty("engagementType")]
    public string? EngagementType { get; set; }

    [JsonProperty("workType")]
    public string? WorkType { get; set; }
  }

  public sealed class Commitment
  {
    [JsonProperty("interval")]
    public string Interval { get; set; } = null!;

    [JsonProperty("count")]
    public int Count { get; set; }
  }
  #endregion

  #region User access
  public sealed class UserAccessRequest
  {
    [JsonProperty("profile")]
    public UserProfile Profile { get; set; } = null!;

    [JsonProperty("opportunityExternalId")]
    public string OpportunityExternalId { get; set; } = null!;
  }

  public sealed class UserProfile
  {
    [JsonProperty("userId")]
    public string UserId { get; set; } = null!;

    [JsonProperty("username")]
    public string Username { get; set; } = null!;

    [JsonProperty("firstName")]
    public string FirstName { get; set; } = null!;

    [JsonProperty("surname")]
    public string Surname { get; set; } = null!;

    [JsonProperty("country")]
    public string Country { get; set; } = null!;

    [JsonProperty("email")]
    public string? Email { get; set; }

    [JsonProperty("mobile")]
    public string? Mobile { get; set; }
  }

  public sealed class UserAccessResponse
  {
    [JsonProperty("token")]
    public string Token { get; set; } = null!;

    [JsonProperty("tokenType")]
    public string TokenType { get; set; } = null!;

    [JsonProperty("expiresIn")]
    public int ExpiresIn { get; set; }

    [JsonProperty("partnerUserId")]
    public string PartnerUserId { get; set; } = null!;

    [JsonProperty("autoLoginUrlPattern")]
    public string AutoLoginUrlPattern { get; set; } = null!;
  }
  #endregion

  #region Verifications
  public sealed class Verification
  {
    [JsonProperty("opportunityRef")]
    public string OpportunityReference { get; set; } = null!;

    [JsonProperty("userRef")]
    public string UserReference { get; set; } = null!;

    [JsonProperty("status")]
    public string Status { get; set; } = null!;

    [JsonProperty("dateCompleted")]
    [JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? DateCompleted { get; set; }

    [JsonProperty("endDate")]
    [JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? DateEnd { get; set; }

    [JsonProperty("commitment")]
    public Commitment? Commitment { get; set; }

    [JsonProperty("startDate")]
    [JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? DateStart { get; set; }

    [JsonProperty("percentComplete")]
    public decimal? PercentComplete { get; set; }
  }
  #endregion
}
