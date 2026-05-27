using Flurl;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Extensions
{
  public static class AlisonUrlExtensions
  {
    public static string ToCourseUrl(this Course course, string webBaseUrl)
    {
      ArgumentNullException.ThrowIfNull(course);

      webBaseUrl = webBaseUrl?.Trim() ?? string.Empty;
      if (string.IsNullOrWhiteSpace(webBaseUrl))
        throw new ArgumentNullException(nameof(webBaseUrl));

      if (!string.IsNullOrWhiteSpace(course.Url))
        return course.Url;

      return !string.IsNullOrWhiteSpace(course.Slug)
        ? webBaseUrl.AppendPathSegment("course").AppendPathSegment(course.Slug.Trim())
        : webBaseUrl.AppendPathSegment("courses").AppendPathSegment(course.Id);
    }

    public static string ToAuthenticatedCourseUrl(this string webBaseUrl, string token, string? course)
    {
      webBaseUrl = webBaseUrl?.Trim() ?? string.Empty;
      if (string.IsNullOrWhiteSpace(webBaseUrl))
        throw new ArgumentNullException(nameof(webBaseUrl));

      if (string.IsNullOrWhiteSpace(token))
        throw new ArgumentNullException(nameof(token));

      if (string.IsNullOrWhiteSpace(course))
        throw new ArgumentNullException(nameof(course));

      return webBaseUrl
        .AppendPathSegment("login")
        .AppendPathSegment("external")
        .SetQueryParam("token", token.Trim())
        .SetQueryParam("course", course.Trim());
    }
  }
}
