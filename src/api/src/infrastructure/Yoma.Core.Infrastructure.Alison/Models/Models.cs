using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Alison.Models
{
  #region Auth
  public sealed class AccessTokenRequest
  {
    [JsonProperty("client_id")]
    public string ClientId { get; set; } = null!;

    [JsonProperty("client_secret")]
    public string ClientSecret { get; set; } = null!;
  }

  public sealed class AccessTokenResponse
  {
    [JsonProperty("access_token")]
    public string AccessToken { get; set; } = null!;

    [JsonProperty("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonProperty("token_type")]
    public string TokenType { get; set; } = null!;

    [JsonIgnore]
    public DateTimeOffset Date { get; } = DateTimeOffset.UtcNow;

    [JsonIgnore]
    public DateTimeOffset DateExpire => Date.AddSeconds(Math.Max(ExpiresIn - 5, 0));
  }
  #endregion

  #region Shared responses / pagination
  public sealed class Response<TItem>
  {
    [JsonProperty("data")]
    public List<TItem> Data { get; set; } = [];

    [JsonProperty("links")]
    public PaginationLinks? Links { get; set; }

    [JsonProperty("meta")]
    public PaginationMeta? Meta { get; set; }

    [JsonIgnore]
    public int? Page => Meta?.CurrentPage;

    [JsonIgnore]
    public int? PerPage => Meta?.PerPage;

    [JsonIgnore]
    public int? Total => Meta?.Total;
  }

  public sealed class PaginationLinks
  {
    [JsonProperty("first")]
    public string? First { get; set; }

    [JsonProperty("last")]
    public string? Last { get; set; }

    [JsonProperty("prev")]
    public string? Previous { get; set; }

    [JsonProperty("next")]
    public string? Next { get; set; }
  }

  public sealed class PaginationMeta
  {
    [JsonProperty("current_page")]
    public int? CurrentPage { get; set; }

    [JsonProperty("from")]
    public int? From { get; set; }

    [JsonProperty("last_page")]
    public int? LastPage { get; set; }

    [JsonProperty("links")]
    public List<PaginationMetaLink> Links { get; set; } = [];

    [JsonProperty("path")]
    public string? Path { get; set; }

    [JsonProperty("per_page")]
    public int? PerPage { get; set; }

    [JsonProperty("to")]
    public int? To { get; set; }

    [JsonProperty("total")]
    public int? Total { get; set; }
  }

  public sealed class PaginationMetaLink
  {
    [JsonProperty("url")]
    public string? Url { get; set; }

    [JsonProperty("label")]
    public string? Label { get; set; }

    [JsonProperty("page")]
    public int? Page { get; set; }

    [JsonProperty("active")]
    public bool Active { get; set; }
  }
  #endregion

  #region Courses / categories
  public sealed class Course
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("slug")]
    public string? Slug { get; set; }

    [JsonProperty("type")]
    public string? Type { get; set; }

    [JsonProperty("language")]
    public string? Language { get; set; }

    [JsonProperty("publishers")]
    public List<Publisher> Publishers { get; set; } = [];

    [JsonProperty("categories")]
    public List<Category> Categories { get; set; } = [];

    [JsonProperty("modules")]
    public List<CourseModule> Modules { get; set; } = [];

    [JsonProperty("tags")]
    public List<Tag> Tags { get; set; } = [];

    [JsonProperty("translations")]
    public List<CourseTranslation> Translations { get; set; } = [];

    [JsonProperty("image")]
    public string? ImageUrl { get; set; }

    [JsonProperty("url")]
    public string? Url { get; set; }

    [JsonProperty("duration_avg")]
    public string? DurationAvg { get; set; }

    [JsonProperty("rating_avg")]
    public decimal? RatingAvg { get; set; }

    [JsonProperty("course_level")]
    public string? CourseLevel { get; set; }

    [JsonProperty("ratings_count")]
    public int? RatingsCount { get; set; }

    [JsonProperty("primary_cip_code")]
    public string? PrimaryCipCode { get; set; }

    [JsonProperty("secondary_cip_code")]
    public string? SecondaryCipCode { get; set; }

    [JsonProperty("published_at")]
    public DateTimeOffset? PublishedAt { get; set; }

    [JsonProperty("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTimeOffset? UpdatedAt { get; set; }

    public string? GetName(string preferredLocale = "en")
    {
      if (!string.IsNullOrWhiteSpace(Name)) return Name;

      return GetPreferredTranslation(preferredLocale)?.Name;
    }

    public string? GetHeadline(string preferredLocale = "en")
    {
      return GetPreferredTranslation(preferredLocale)?.Headline;
    }

    public string? GetSummary(string preferredLocale = "en")
    {
      return GetPreferredTranslation(preferredLocale)?.Summary;
    }

    private CourseTranslation? GetPreferredTranslation(string preferredLocale)
    {
      return Translations.FirstOrDefault(item =>
          string.Equals(item.Locale, preferredLocale, StringComparison.OrdinalIgnoreCase))
        ?? Translations.FirstOrDefault();
    }
  }

  public sealed class Publisher
  {
    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("slug")]
    public string? Slug { get; set; }

    [JsonProperty("image")]
    public string? ImageUrl { get; set; }

    [JsonProperty("location")]
    public string? Location { get; set; }

    [JsonProperty("country_id")]
    public int? CountryId { get; set; }
  }

  public sealed class Category
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("parent_id")]
    public int? ParentId { get; set; }

    [JsonProperty("code")]
    public string? Code { get; set; }

    [JsonProperty("courses_count")]
    public int? CoursesCount { get; set; }

    [JsonProperty("translations")]
    public List<CategoryTranslation> Translations { get; set; } = [];

    [JsonProperty("subcategories")]
    public List<Category> Subcategories { get; set; } = [];

    [JsonProperty("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTimeOffset? UpdatedAt { get; set; }

    public string? GetName(string preferredLocale = "en")
    {
      return Translations.FirstOrDefault(item =>
          string.Equals(item.Locale, preferredLocale, StringComparison.OrdinalIgnoreCase))?.Name
        ?? Translations.FirstOrDefault()?.Name;
    }
  }

  public sealed class CategoryTranslation
  {
    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("locale")]
    public string? Locale { get; set; }
  }

  public sealed class CourseModule
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("completed")]
    public bool? Completed { get; set; }

    [JsonProperty("scos")]
    public List<CourseModuleSco> Scos { get; set; } = [];
  }

  public sealed class CourseModuleSco
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("completed")]
    public bool? Completed { get; set; }
  }

  public sealed class Tag
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("courses_count")]
    public int? CoursesCount { get; set; }

    [JsonProperty("translations")]
    public List<TagTranslation> Translations { get; set; } = [];

    [JsonProperty("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTimeOffset? UpdatedAt { get; set; }

    public string? GetName(string preferredLocale = "en")
    {
      return Translations.FirstOrDefault(item =>
          string.Equals(item.Locale, preferredLocale, StringComparison.OrdinalIgnoreCase))?.Name
        ?? Translations.FirstOrDefault()?.Name;
    }

    public string? GetSlug(string preferredLocale = "en")
    {
      return Translations.FirstOrDefault(item =>
          string.Equals(item.Locale, preferredLocale, StringComparison.OrdinalIgnoreCase))?.Slug
        ?? Translations.FirstOrDefault()?.Slug;
    }
  }

  public sealed class TagTranslation
  {
    [JsonProperty("id")]
    public int? Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("slug")]
    public string? Slug { get; set; }

    [JsonProperty("locale")]
    public string? Locale { get; set; }
  }

  public sealed class CourseTranslation
  {
    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("headline")]
    public string? Headline { get; set; }

    [JsonProperty("summary")]
    public string? Summary { get; set; }

    [JsonProperty("locale")]
    public string? Locale { get; set; }
  }
  #endregion

  #region Completed courses
  public sealed class CompletedCourse
  {
    [JsonProperty("user_id")]
    public int UserId { get; set; }

    [JsonProperty("email")]
    public string? Email { get; set; }

    [JsonProperty("course_id")]
    public int CourseId { get; set; }

    [JsonProperty("duration_avg")]
    public string? DurationAvg { get; set; }

    [JsonProperty("first_access")]
    public DateTimeOffset? FirstAccess { get; set; }

    [JsonProperty("enrollment_date")]
    public DateTimeOffset? EnrollmentDate { get; set; }

    [JsonProperty("last_access")]
    public DateTimeOffset? LastAccess { get; set; }

    [JsonProperty("total_time_spent")]
    public string? TotalTimeSpent { get; set; }

    [JsonProperty("course_state")]
    public string? CourseState { get; set; }

    [JsonProperty("course_status")]
    public string? CourseStatus { get; set; }

    [JsonProperty("scores")]
    public string? Scores { get; set; }

    [JsonProperty("published_at")]
    public DateTimeOffset? PublishedAt { get; set; }

    [JsonProperty("completed_at")]
    public DateTimeOffset? CompletedAt { get; set; }

    [JsonProperty("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTimeOffset? UpdatedAt { get; set; }

    [JsonProperty("has_certificate")]
    public bool? HasCertificate { get; set; }
  }
  #endregion
}
