using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Domain.Core.Validators
{
  public static class FileValidator
  {
    #region Class Variables
    private sealed record FileRule(string[] Extensions, long MaxSizeBytes);

    private static readonly Dictionary<FileType, FileRule> Rules = new()
    {
      [FileType.Photos] = new([".png", ".jpg", ".jpeg", ".webp"], 10_000_000),
      [FileType.Certificates] = new([".pdf", ".doc", ".docx", ".pptx", ".png", ".jpg", ".jpeg", ".webp"], 10_000_000),
      [FileType.Documents] = new([".pdf", ".doc", ".docx", ".pptx"], 10_000_000),
      [FileType.VoiceNotes] = new([".wav", ".mp3", ".m4a", ".amr", ".ogg", ".3gp"], 10_000_000),
      [FileType.Videos] = new([".mp4", ".mov", ".avi", ".mkv", ".wmv", ".webm", ".flv", ".3gp", ".m4v"], 100_000_000),
      [FileType.ZipArchive] = new([".zip"], 10_000_000_000),
      [FileType.CSV] = new([".csv"], 5_000_000),
    };
    #endregion

    #region Public Members
    public static void Validate(FileType type, IFormFile file)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));
      if (!Rules.TryGetValue(type, out var rule))
        throw new ArgumentOutOfRangeException(nameof(type), $"Unsupported type of '{type}'");

      var ext = file.GetExtension();
      if (!rule.Extensions.Contains(ext, StringComparer.InvariantCultureIgnoreCase))
        throw new BusinessException($"Only supports file formats '{string.Join(",", rule.Extensions)}'");

      if (file.Length > rule.MaxSizeBytes)
        throw new BusinessException($"Only supports file size smaller or equal to '{ToMb(rule.MaxSizeBytes)}MB'");
    }

    public static void Validate(string fileName, long lengthBytes)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(fileName, nameof(fileName));
      fileName = fileName.Trim();

      ArgumentOutOfRangeException.ThrowIfNegative(lengthBytes);

      var ext = Path.GetExtension(fileName);
      if (string.IsNullOrWhiteSpace(ext))
        throw new BusinessException("Only supports file formats with a valid extension");
      ext = ext.Trim();

      var match = Rules.Values.FirstOrDefault(r =>
        r.Extensions.Contains(ext, StringComparer.InvariantCultureIgnoreCase))
        ?? throw new BusinessException($"Only supports file formats '{string.Join(",", Rules.Values.SelectMany(r => r.Extensions).Distinct())}'");

      if (lengthBytes > match.MaxSizeBytes)
        throw new BusinessException($"Only supports file size smaller or equal to '{ToMb(match.MaxSizeBytes)}MB'");
    }
    #endregion

    #region Private Members
    private static decimal ToMb(long bytes) => Math.Round((decimal)bytes / 1_000_000, 2);
    #endregion
  }
}
