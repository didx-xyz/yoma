using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Alison.Models
{
  public sealed class OAuthResponse
  {
    [JsonProperty("access_token")]
    public string Access_token { get; set; } = null!;

    [JsonProperty("expires_in")]
    public int Expires_in { get; set; }

    [JsonProperty("token_type")]
    public string Token_type { get; set; } = null!;

    [JsonIgnore]
    public DateTimeOffset Date { get; } = DateTimeOffset.UtcNow;

    [JsonIgnore]
    public DateTimeOffset DateExpire => Date.AddSeconds(Expires_in - 5);
  }

  public sealed class AlisonPagedResponse<TItem>
  {
    [JsonProperty("page")]
    public int Page { get; set; }

    [JsonProperty("per_page")]
    public int PerPage { get; set; }

    [JsonProperty("total")]
    public int Total { get; set; }

    [JsonProperty("data")]
    public List<TItem> Data { get; set; } = [];
  }

  public sealed class AlisonCategory
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("code")]
    public string? Code { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }
  }

  public sealed class AlisonTag
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }
  }

  public sealed class AlisonPublisher
  {
    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("location")]
    public string? Location { get; set; }
  }

  public sealed class AlisonCourseModule
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("description")]
    public string? Description { get; set; }
  }

  public sealed class AlisonCourse
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; } = null!;

    [JsonProperty("slug")]
    public string? Slug { get; set; }

    [JsonProperty("type")]
    public string? Type { get; set; }

    [JsonProperty("language")]
    public string? Language { get; set; }

    [JsonProperty("categories")]
    public List<AlisonCategory> Categories { get; set; } = [];

    [JsonProperty("modules")]
    public List<AlisonCourseModule> Modules { get; set; } = [];

    [JsonProperty("tags")]
    public List<AlisonTag> Tags { get; set; } = [];

    [JsonProperty("publishers")]
    public List<AlisonPublisher> Publishers { get; set; } = [];

    [JsonProperty("duration_avg")]
    public decimal? DurationAvg { get; set; }

    [JsonProperty("rating_avg")]
    public decimal? RatingAvg { get; set; }

    [JsonProperty("rating_count")]
    public int? RatingCount { get; set; }

    [JsonProperty("published_at")]
    public DateTimeOffset? PublishedAt { get; set; }

    [JsonProperty("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTimeOffset? UpdatedAt { get; set; }
  }
}
