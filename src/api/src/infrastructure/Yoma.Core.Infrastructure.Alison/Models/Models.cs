using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Alison.Models
{
  #region Auth
  public sealed class AlisonAccessTokenRequest
  {
    [JsonProperty("client_id")]
    public string ClientId { get; set; } = null!;

    [JsonProperty("client_secret")]
    public string ClientSecret { get; set; } = null!;
  }

  public sealed class AlisonAccessTokenResponse
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
  public sealed class AlisonResponse<TItem>
  {
    [JsonProperty("data")]
    public List<TItem> Data { get; set; } = [];

    [JsonProperty("links")]
    public AlisonPaginationLinks? Links { get; set; }

    [JsonProperty("meta")]
    public AlisonPaginationMeta? Meta { get; set; }

    [JsonIgnore]
    public int? Page => Meta?.CurrentPage;

    [JsonIgnore]
    public int? PerPage => Meta?.PerPage;

    [JsonIgnore]
    public int? Total => Meta?.Total;
  }

  public sealed class AlisonPaginationLinks
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

  public sealed class AlisonPaginationMeta
  {
    [JsonProperty("current_page")]
    public int? CurrentPage { get; set; }

    [JsonProperty("from")]
    public int? From { get; set; }

    [JsonProperty("last_page")]
    public int? LastPage { get; set; }

    [JsonProperty("links")]
    public List<AlisonPaginationMetaLink> Links { get; set; } = [];

    [JsonProperty("path")]
    public string? Path { get; set; }

    [JsonProperty("per_page")]
    public int? PerPage { get; set; }

    [JsonProperty("to")]
    public int? To { get; set; }

    [JsonProperty("total")]
    public int? Total { get; set; }
  }

  public sealed class AlisonPaginationMetaLink
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
  public sealed class AlisonCourse
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
    public List<AlisonPublisher> Publishers { get; set; } = [];

    [JsonProperty("categories")]
    public List<AlisonCategory> Categories { get; set; } = [];

    [JsonProperty("modules")]
    public List<AlisonCourseModule> Modules { get; set; } = [];

    [JsonProperty("tags")]
    public List<AlisonTag> Tags { get; set; } = [];

    [JsonProperty("translations")]
    public List<AlisonCourseTranslation> Translations { get; set; } = [];

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
    public string? PublishedAt { get; set; }

    [JsonProperty("created_at")]
    public string? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public string? UpdatedAt { get; set; }

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

    private AlisonCourseTranslation? GetPreferredTranslation(string preferredLocale)
    {
      return Translations.FirstOrDefault(item =>
          string.Equals(item.Locale, preferredLocale, StringComparison.OrdinalIgnoreCase))
        ?? Translations.FirstOrDefault();
    }
  }

  public sealed class AlisonPublisher
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

  public sealed class AlisonCategory
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
    public List<AlisonCategoryTranslation> Translations { get; set; } = [];

    [JsonProperty("subcategories")]
    public List<AlisonCategory> Subcategories { get; set; } = [];

    [JsonProperty("created_at")]
    public string? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public string? UpdatedAt { get; set; }

    public string? GetName(string preferredLocale = "en")
    {
      return Translations.FirstOrDefault(item =>
          string.Equals(item.Locale, preferredLocale, StringComparison.OrdinalIgnoreCase))?.Name
        ?? Translations.FirstOrDefault()?.Name;
    }
  }

  public sealed class AlisonCategoryTranslation
  {
    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("locale")]
    public string? Locale { get; set; }
  }

  public sealed class AlisonCourseModule
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
    public List<AlisonCourseModuleSco> Scos { get; set; } = [];
  }

  public sealed class AlisonCourseModuleSco
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("completed")]
    public bool? Completed { get; set; }
  }

  public sealed class AlisonTag
  {
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("courses_count")]
    public int? CoursesCount { get; set; }

    [JsonProperty("translations")]
    public List<AlisonTagTranslation> Translations { get; set; } = [];

    [JsonProperty("created_at")]
    public string? CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public string? UpdatedAt { get; set; }

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

  public sealed class AlisonTagTranslation
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

  public sealed class AlisonCourseTranslation
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
}
