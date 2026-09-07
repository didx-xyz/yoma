using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Converters;

namespace Yoma.Core.Infrastructure.Umuzi.Models
{
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

  public sealed class PageResponse<TItem>
  {
    [JsonProperty("page")]
    public int Page { get; set; }
    [JsonProperty("pageSize")]
    public int PageSize { get; set; }
    [JsonProperty("totalItems", Required = Required.Always)]
    public int TotalItems { get; set; }
    [JsonProperty("items", Required = Required.Always)]
    public List<TItem> Items { get; set; } = [];
  }

  public sealed class OpportunityResponse
  {
    [JsonProperty("id")]
    public Guid Id { get; set; }
    [JsonProperty("externalId")]
    public string ExternalId { get; set; } = null!;
    [JsonProperty("umuziType")]
    public string UmuziType { get; set; } = null!;
    [JsonProperty("yomaType")]
    public string Type { get; set; } = null!;
    [JsonProperty("title")]
    public string Title { get; set; } = null!;
    [JsonProperty("url")]
    public string URL { get; set; } = null!;
    [JsonProperty("description")]
    public string? Description { get; set; }
    [JsonProperty("summary")]
    public string? Summary { get; set; }
    [JsonProperty("categories")]
    public List<string> Categories { get; set; } = [];
    [JsonProperty("countries")]
    public List<string> Countries { get; set; } = [];
    [JsonProperty("languages")]
    public List<string> Languages { get; set; } = [];
    [JsonProperty("skills")]
    public List<string> Skills { get; set; } = [];
    [JsonProperty("keywords")]
    public List<string> Keywords { get; set; } = [];
    [JsonProperty("startDate"), JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset StartDate { get; set; }
    [JsonProperty("endDate"), JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? EndDate { get; set; }
    [JsonProperty("commitmentInterval")]
    public string? CommitmentInterval { get; set; }
    [JsonProperty("commitmentCount")]
    public int? CommitmentCount { get; set; }
    [JsonProperty("difficulty")]
    public string? Difficulty { get; set; }
    [JsonProperty("engagementType")]
    public string? EngagementType { get; set; }
    // Nullable so an omitted active flag cannot silently delete an opportunity.
    [JsonProperty("active")]
    public bool? Active { get; set; }
    [JsonProperty("createdAt"), JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? CreatedAt { get; set; }
    [JsonProperty("updatedAt"), JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? UpdatedAt { get; set; }
  }

  public sealed class Verification
  {
    [JsonProperty("opportunityExternalId")]
    public string OpportunityExternalId { get; set; } = null!;
    [JsonProperty("yomaUserId")]
    public string? YomaUserId { get; set; }
    [JsonProperty("username")]
    public string? Username { get; set; }
    [JsonProperty("status")]
    public string Status { get; set; } = null!;
    // Accept null for unfinished records; completed/placed records are validated explicitly.
    [JsonProperty("dateCompleted"), JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? DateCompleted { get; set; }
    [JsonProperty("endOrLastActivity"), JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset? EndOrLastActivity { get; set; }
    [JsonProperty("percentComplete")]
    public decimal? PercentComplete { get; set; }
    [JsonProperty("recordedAt"), JsonConverter(typeof(UtcDateTimeOffsetConverter))]
    public DateTimeOffset RecordedAt { get; set; }
  }
}
