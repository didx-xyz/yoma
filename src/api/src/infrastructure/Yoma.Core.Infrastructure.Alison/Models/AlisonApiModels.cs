using System.Text.Json.Serialization;

namespace Yoma.Core.Infrastructure.Alison.Models
{
  public sealed class AlisonApiErrorResponse
  {
    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("errors")]
    public List<string>? Errors { get; set; }
  }

  public sealed class AlisonAccessTokenRequest
  {
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = null!;

    [JsonPropertyName("client_secret")]
    public string ClientSecret { get; set; } = null!;

    [JsonPropertyName("organization_id")]
    public string OrganizationId { get; set; } = null!;

    [JsonPropertyName("organization_key")]
    public string OrganizationKey { get; set; } = null!;
  }

  public sealed class AlisonAccessTokenResponse
  {
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = null!;

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }

    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; set; }
  }

  public sealed class AlisonRefreshTokenRequest
  {
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = null!;

    [JsonPropertyName("client_secret")]
    public string ClientSecret { get; set; } = null!;

    [JsonPropertyName("organization_id")]
    public string OrganizationId { get; set; } = null!;

    [JsonPropertyName("organization_key")]
    public string OrganizationKey { get; set; } = null!;

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = null!;
  }

  public sealed class AlisonRefreshTokenResponse
  {
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = null!;

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }

    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; set; }
  }

  public sealed class AlisonToken
  {
    public string AccessToken { get; private set; } = null!;

    public string? RefreshToken { get; private set; }

    public string TokenType { get; private set; } = null!;

    public int? ExpiresIn { get; private set; }

    public static AlisonToken Create(string accessToken, string? refreshToken, string? tokenType, int? expiresIn)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);

      return new AlisonToken
      {
        AccessToken = accessToken,
        RefreshToken = refreshToken,
        TokenType = string.IsNullOrWhiteSpace(tokenType) ? "Bearer" : tokenType,
        ExpiresIn = expiresIn
      };
    }
  }

  public sealed class AlisonRegisterUserRequest
  {
    [JsonPropertyName("email")]
    public string Email { get; set; } = null!;

    [JsonPropertyName("firstname")]
    public string Firstname { get; set; } = null!;

    [JsonPropertyName("lastname")]
    public string Lastname { get; set; } = null!;

    [JsonPropertyName("city")]
    public string? City { get; set; }

    [JsonPropertyName("country")]
    public string? Country { get; set; }
  }

  public sealed class AlisonLoginRequest
  {
    [JsonPropertyName("email")]
    public string Email { get; set; } = null!;
  }

  public sealed class AlisonLoginResponse
  {
    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("login_url")]
    public string? LoginUrl { get; set; }
  }

  public sealed class AlisonPagedResponse<TItem>
  {
    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("per_page")]
    public int PerPage { get; set; }

    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("data")]
    public List<TItem> Data { get; set; } = [];
  }

  public sealed class AlisonCategory
  {
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("code")]
    public string? Code { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;
  }

  public sealed class AlisonTag
  {
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;
  }

  public sealed class AlisonPublisher
  {
    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;

    [JsonPropertyName("location")]
    public string? Location { get; set; }
  }

  public sealed class AlisonCourseModule
  {
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;

    [JsonPropertyName("description")]
    public string? Description { get; set; }
  }

  public sealed class AlisonCourse
  {
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = null!;

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("language")]
    public string? Language { get; set; }

    [JsonPropertyName("categories")]
    public List<AlisonCategory> Categories { get; set; } = [];

    [JsonPropertyName("modules")]
    public List<AlisonCourseModule> Modules { get; set; } = [];

    [JsonPropertyName("tags")]
    public List<AlisonTag> Tags { get; set; } = [];

    [JsonPropertyName("publishers")]
    public List<AlisonPublisher> Publishers { get; set; } = [];

    [JsonPropertyName("duration_avg")]
    public decimal? DurationAvg { get; set; }

    [JsonPropertyName("rating_avg")]
    public decimal? RatingAvg { get; set; }

    [JsonPropertyName("rating_count")]
    public int? RatingCount { get; set; }

    [JsonPropertyName("published_at")]
    public DateTimeOffset? PublishedAt { get; set; }

    [JsonPropertyName("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTimeOffset? UpdatedAt { get; set; }
  }

  public sealed class AlisonUser
  {
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; } = null!;

    [JsonPropertyName("firstname")]
    public string Firstname { get; set; } = null!;

    [JsonPropertyName("lastname")]
    public string Lastname { get; set; } = null!;

    [JsonPropertyName("verified")]
    public bool Verified { get; set; }

    [JsonPropertyName("is_public")]
    public bool IsPublic { get; set; }

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }

    [JsonPropertyName("country_id")]
    public int? CountryId { get; set; }

    [JsonPropertyName("first_access")]
    public DateTimeOffset? FirstAccess { get; set; }

    [JsonPropertyName("last_access")]
    public DateTimeOffset? LastAccess { get; set; }

    [JsonPropertyName("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTimeOffset? UpdatedAt { get; set; }
  }

  public sealed class AlisonUserCourse
  {
    [JsonPropertyName("course_id")]
    public int CourseId { get; set; }

    [JsonPropertyName("course_name")]
    public string? CourseName { get; set; }

    [JsonPropertyName("progress")]
    public decimal? Progress { get; set; }

    [JsonPropertyName("completed")]
    public bool? Completed { get; set; }
  }

  public sealed class AlisonCourseCompletion
  {
    [JsonPropertyName("user_id")]
    public int UserId { get; set; }

    [JsonPropertyName("course_id")]
    public int CourseId { get; set; }

    [JsonPropertyName("hours")]
    public decimal? Hours { get; set; }

    [JsonPropertyName("completed_at")]
    public DateTimeOffset? CompletedAt { get; set; }
  }

  public sealed class AlisonStudyDurationResponse
  {
    [JsonPropertyName("minutes")]
    public int? Minutes { get; set; }

    [JsonPropertyName("hours")]
    public decimal? Hours { get; set; }
  }
}
