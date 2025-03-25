using Microsoft.AspNetCore.Http;
using System.Collections.Concurrent;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class TempFileTracker
  {
    private static readonly ConcurrentDictionary<IFormFile, (string TempPath, FileStream Stream)> _tracked = new();

    public static void Register(IFormFile file, string tempPath, FileStream stream)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));
      ArgumentException.ThrowIfNullOrWhiteSpace(tempPath, nameof(tempPath));
      ArgumentNullException.ThrowIfNull(stream, nameof(stream));

      _tracked[file] = (tempPath.Trim(), stream);
    }

    public static bool IsTracked(IFormFile file)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));
      return _tracked.ContainsKey(file);
    }

    public static (string TempPath, FileStream Stream)? Get(IFormFile file)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));
      return _tracked.TryGetValue(file, out var result) ? result : null;
    }

    public static void Remove(IFormFile file)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));
      _tracked.TryRemove(file, out _);
    }
  }
}
