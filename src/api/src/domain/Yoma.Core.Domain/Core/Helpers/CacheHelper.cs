namespace Yoma.Core.Domain.Core.Helpers
{
  public static class CacheHelper
  {
    public static string GenerateKey<T>(params object[] suffixes) where T : class
    {
      var typeName = typeof(T).FullName ?? throw new InvalidOperationException($"Error generating cache key. Type {typeof(T)} 'full name' is null");
      if (suffixes == null || suffixes.Length == 0) return typeName;

      var suffixesCleaned = suffixes.Where(o => o != null).Select(o => o.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();

      return suffixesCleaned.Length == 0 ? typeName : $"{typeName}:{string.Join('_', suffixesCleaned)}";
    }
  }
}
