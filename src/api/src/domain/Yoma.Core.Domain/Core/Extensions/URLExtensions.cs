namespace Yoma.Core.Domain.Core.Extensions
{
    public static class URLExtensions
    {
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
    }
}
