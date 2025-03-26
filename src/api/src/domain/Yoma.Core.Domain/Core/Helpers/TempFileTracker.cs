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
      tempPath = tempPath.Trim();

      ArgumentNullException.ThrowIfNull(stream, nameof(stream));

      if (!_tracked.TryAdd(file, (tempPath, stream)))
        throw new InvalidOperationException($"The file '{file.FileName}' is already registered for tracking.");
    }

    public static void Delete(List<IFormFile> files)
    {
      if (files == null || files.Count == 0) return;

      foreach (var file in files)
      {
        try
        {
          if (!_tracked.TryGetValue(file, out var tempFile)) continue;

          tempFile.Stream.Dispose();
          if (File.Exists(tempFile.TempPath)) File.Delete(tempFile.TempPath);
        }
        catch { }
        finally
        {
          _tracked.TryRemove(file, out _);
        }
      }
    }
  }
}
