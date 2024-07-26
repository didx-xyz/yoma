using Microsoft.AspNetCore.Http;
using System.IO.Compression;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class FileHelper
  {
    public static IFormFile FromByteArray(string fileName, string contentType, byte[] data)
    {
      if (string.IsNullOrWhiteSpace(fileName))
        throw new ArgumentNullException(nameof(fileName));
      fileName = fileName.Trim();

      if (data == null || data.Length == 0)
        throw new ArgumentNullException(nameof(data));

      var result = new FormFile(new MemoryStream(data), 0, data.Length, Path.GetFileNameWithoutExtension(fileName), fileName)
      {
        Headers = new HeaderDictionary(),
        ContentType = contentType,
        ContentDisposition = new System.Net.Mime.ContentDisposition() { FileName = fileName }.ToString()
      };

      return result;
    }

    public static IFormFile Zip(List<IFormFile> files, string fileName)
    {
      if (files == null || files.Count == 0)
        ArgumentNullException.ThrowIfNull(files, nameof(files));

      ArgumentException.ThrowIfNullOrWhiteSpace(fileName, nameof(fileName));
      fileName = fileName.Trim();

      if (!Path.GetExtension(fileName).Equals(".zip", StringComparison.CurrentCultureIgnoreCase))
        throw new ArgumentException("File name must end with '.zip' extension.", nameof(fileName));

      using var memoryStream = new MemoryStream();
      using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
      {
        foreach (var file in files)
        {
          var entry = archive.CreateEntry(file.FileName, CompressionLevel.Fastest);
          using var entryStream = entry.Open();
          using var fileStream = file.OpenReadStream();
          fileStream.CopyTo(entryStream);
        }
      }

      return FromByteArray(fileName, "application/zip", memoryStream.ToArray());
    }
  }
}
