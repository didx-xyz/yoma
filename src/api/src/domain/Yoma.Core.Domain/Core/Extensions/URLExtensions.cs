using Microsoft.AspNetCore.WebUtilities;
using System.Text;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class URLExtensions
  {
    #region Public Members
    public static string? EnsureHttpsScheme(this string? url)
    {
      url = url?.Trim();
      if (string.IsNullOrWhiteSpace(url)) return null;

      try
      {
        var uri = new Uri(url, UriKind.RelativeOrAbsolute);

        if (uri.IsAbsoluteUri) return url;
        return "https://" + url;
      }
      catch
      {
        return url;
      }
    }

    /// <summary>
    /// Normalizes a URL for comparison/dedup:
    /// - Preserves scheme/host/path/fragment
    /// - Rebuilds query string without common tracking params (utm_*, mc_*)
    /// - Removes trailing slash only for root
    /// On parse errors, returns the original.
    /// </summary>
    public static string NormalizeForDedup(this string url)
    {
      if (string.IsNullOrWhiteSpace(url)) return url;

      try
      {
        var uri = new Uri(url);
        var qp = QueryHelpers.ParseQuery(uri.Query);

        var queryBuilder = new StringBuilder();
        foreach (var kvp in qp)
        {
          var key = kvp.Key ?? string.Empty;
          if (IsTrackingParam(key)) continue;

          foreach (var val in kvp.Value)
          {
            var safeVal = val ?? string.Empty;

            queryBuilder.Append(queryBuilder.Length == 0 ? '?' : '&');
            queryBuilder.Append(Uri.EscapeDataString(key));
            queryBuilder.Append('=');
            queryBuilder.Append(Uri.EscapeDataString(safeVal));
          }
        }

        var ub = new UriBuilder(uri) { Query = queryBuilder.ToString().TrimStart('?') };

        // Normalize trailing slash on root only
        if (ub.Path == "/") ub.Path = string.Empty;

        return ub.Uri.ToString();
      }
      catch
      {
        return url;
      }
    }
    #endregion

    #region Private Members
    private static bool IsTrackingParam(string? key)
    {
      if (string.IsNullOrEmpty(key)) return false;

      return
        key.Equals("utm_source", StringComparison.OrdinalIgnoreCase) ||
        key.Equals("utm_medium", StringComparison.OrdinalIgnoreCase) ||
        key.Equals("utm_campaign", StringComparison.OrdinalIgnoreCase) ||
        key.Equals("utm_term", StringComparison.OrdinalIgnoreCase) ||
        key.Equals("utm_content", StringComparison.OrdinalIgnoreCase) ||
        key.Equals("utm_id", StringComparison.OrdinalIgnoreCase) ||
        key.Equals("mc_cid", StringComparison.OrdinalIgnoreCase) ||
        key.Equals("mc_eid", StringComparison.OrdinalIgnoreCase);
    }
    #endregion
  }
}

