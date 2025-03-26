using CsvHelper.Configuration;
using CsvHelper;
using Microsoft.AspNetCore.Http;
using System.Globalization;
using System.IO.Compression;
using System.Text;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class FileHelper
  {
    public const string Zip_FileName_Path_Separator = "_ZipFolder_";

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

    public static IFormFile FromFilePath(string fileName, string contentType, string tempSourceFile)
    {
      if (string.IsNullOrWhiteSpace(fileName))
        throw new ArgumentNullException(nameof(fileName));
      fileName = fileName.Trim();

      if (string.IsNullOrWhiteSpace(contentType))
        throw new ArgumentNullException(nameof(contentType));

      if (string.IsNullOrWhiteSpace(tempSourceFile))
        throw new ArgumentNullException(nameof(tempSourceFile));

      if (!File.Exists(tempSourceFile))
        throw new FileNotFoundException("The source file was not found", tempSourceFile);

      var fileInfo = new FileInfo(tempSourceFile);
      var stream = new FileStream(tempSourceFile, FileMode.Open, FileAccess.Read, FileShare.Read);

      var result = new FormFile(stream, 0, fileInfo.Length, Path.GetFileNameWithoutExtension(fileName), fileName)
      {
        Headers = new HeaderDictionary(),
        ContentType = contentType,
        ContentDisposition = new System.Net.Mime.ContentDisposition() { FileName = fileName }.ToString()
      };

      // Track temp file and stream for cleanup later
      TempFileTracker.Register(result, tempSourceFile, stream);

      return result;
    }

    public static IFormFile Zip(List<IFormFile> files, string fileName)
    {
      if (files == null || files.Count == 0)
        throw new ArgumentNullException(nameof(files));

      ArgumentException.ThrowIfNullOrWhiteSpace(fileName, nameof(fileName));
      fileName = fileName.Trim();

      if (!Path.GetExtension(fileName).Equals(".zip", StringComparison.CurrentCultureIgnoreCase))
        throw new ArgumentException("File name must end with '.zip' extension", nameof(fileName));

      using var memoryStream = new MemoryStream();
      using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
      {
        foreach (var file in files)
        {
          var entryName = file.FileName.Replace(Zip_FileName_Path_Separator, "/");

          var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
          using var entryStream = entry.Open();
          using var fileStream = file.OpenReadStream();
          fileStream.CopyTo(entryStream);
        }
      }

      return FromByteArray(fileName, "application/zip", memoryStream.ToArray());
    }

    public static IFormFile ZipToDisk(List<IFormFile> files, string fileName)
    {
      if (files == null || files.Count == 0)
        throw new ArgumentNullException(nameof(files));

      ArgumentException.ThrowIfNullOrWhiteSpace(fileName, nameof(fileName));
      fileName = fileName.Trim();

      if (!Path.GetExtension(fileName).Equals(".zip", StringComparison.OrdinalIgnoreCase))
        throw new ArgumentException("File name must end with '.zip' extension", nameof(fileName));

      var tempSourceFile = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

      using (var zipStream = new FileStream(tempSourceFile, FileMode.Create, FileAccess.Write, FileShare.None))
      using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: false))
      {
        foreach (var file in files)
        {
          var entryName = file.FileName.Replace(Zip_FileName_Path_Separator, "/");

          var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
          using var entryStream = entry.Open();
          using var inputStream = file.OpenReadStream();
          inputStream.CopyTo(entryStream);
        }
      }

      return FromFilePath(fileName, "application/zip", tempSourceFile);
    }

    public static (string fileName, byte[] bytes) CreateCsvFile<T>(IEnumerable<T> records, string fileNamePrefix, bool appendDateStamp)
    {
      ArgumentNullException.ThrowIfNull(records, nameof(records));
      ArgumentException.ThrowIfNullOrWhiteSpace(fileNamePrefix, nameof(fileNamePrefix));
      fileNamePrefix = fileNamePrefix.Trim();

      var config = new CsvConfiguration(CultureInfo.CurrentCulture);

      using var stream = new MemoryStream();
      using (var streamWriter = new StreamWriter(stream, Encoding.UTF8))
      {
        using var writer = new CsvWriter(streamWriter, config);
        writer.WriteRecords(records);
      }

      var fileName = appendDateStamp
        ? $"{fileNamePrefix}_{DateTimeOffset.UtcNow:yyyy-MM-dd}.csv"
        : $"{fileNamePrefix}.csv";

      return (fileName, stream.ToArray());
    }
  }
}
