using CsvHelper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;
using System.Globalization;
using System.IO.Compression;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class FileHelper
  {
    public const string Zip_FileName_Path_Separator = "_ZipFolder_";

    // Cover supported formats missing from the framework map and use audio for Ogg voice notes.
    private static readonly FileExtensionContentTypeProvider _contentTypeProvider = new()
    {
      Mappings =
      {
        [".amr"] = "audio/amr",
        [".mkv"] = "video/x-matroska",
        [".ogg"] = "audio/ogg",
        [".zip"] = "application/zip"
      }
    };

    private static readonly Dictionary<string, string[]> _contentTypeAliases = new(StringComparer.OrdinalIgnoreCase)
    {
      [".jpg"] = ["image/jpg", "image/pjpeg"],
      [".jpeg"] = ["image/jpg", "image/pjpeg"],
      [".png"] = ["image/x-png"],
      [".wav"] = ["audio/x-wav", "audio/wave", "audio/vnd.wave"],
      [".mp3"] = ["audio/mp3", "audio/x-mp3"],
      [".m4a"] = ["audio/x-m4a"],
      [".ogg"] = ["application/ogg", "video/ogg"],
      [".3gp"] = ["audio/3gpp", "video/3gpp"],
      [".mkv"] = ["video/matroska"],
      [".zip"] = ["application/x-zip-compressed"],
      [".csv"] = ["application/vnd.ms-excel"]
    };

    /// <summary>
    /// Retains a supplied MIME type only when it matches the extension's known type or aliases.
    /// Missing, generic or mismatched types use the server mapping after extension/size validation.
    /// This does not inspect file contents or replace isolation of document previews.
    /// </summary>
    public static string GetContentType(string fileName, string? suppliedContentType = null, FileType? type = null)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
      fileName = fileName.Trim();
      var extension = Path.GetExtension(fileName);
      var contentType = _contentTypeProvider.TryGetContentType(fileName, out var mappedContentType)
        ? mappedContentType : "application/octet-stream";

      // 3GP supports both audio and video; retain a valid supplied type and use the category for fallback.
      if (type == FileType.VoiceNotes && string.Equals(extension, ".3gp", StringComparison.OrdinalIgnoreCase))
        contentType = "audio/3gpp";

      if (MediaTypeHeaderValue.TryParse(suppliedContentType, out var supplied) &&
        (string.Equals(supplied.MediaType, contentType, StringComparison.OrdinalIgnoreCase) ||
          (_contentTypeAliases.TryGetValue(extension, out var aliases) && aliases.Contains(supplied.MediaType, StringComparer.OrdinalIgnoreCase))))
        return supplied.ToString();

      return contentType;
    }

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

      // track temp file and stream for cleanup later
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

      using var zipStream = new MemoryStream();
      using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, true))
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

      return FromByteArray(fileName, "application/zip", zipStream.ToArray());
    }

    public static IFormFile ZipToFile(List<IFormFile> files, string fileName)
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

      var culture = CultureInfo.CurrentCulture;
      var config = new CsvWriterOptions
      {
        FormatProvider = culture,
        Separator = culture.TextInfo.ListSeparator[0],
        Quoting = CsvQuoting.WhenNeededOrWhitespace
      };

      using var stream = new MemoryStream();
      using (var streamWriter = new StreamWriter(stream, Encoding.UTF8))
      {
        using var writer = CsvWriter.Create(streamWriter, config);

        // v34's generated record writer omits get-only properties. Our export contracts
        // deliberately include flattened/computed fields, so retain their declared order,
        // aliases and culture-specific formatting instead of silently dropping columns.
        foreach (var (_, name, _) in CsvExportColumns<T>.Columns)
          writer.WriteField(name);
        writer.EndRecord();

        foreach (var record in records)
        {
          foreach (var (property, _, booleanValues) in CsvExportColumns<T>.Columns)
          {
            var value = property.GetValue(record);
            var text = value is bool boolean && booleanValues != null
              ? (boolean ? booleanValues.TrueValues : booleanValues.FalseValues)[0]
              : value is IFormattable formatted ? formatted.ToString(null, culture) : value?.ToString();
            writer.WriteField(text);
          }
          writer.EndRecord();
        }
      }

      var fileName = appendDateStamp
        ? $"{fileNamePrefix}_{DateTimeOffset.UtcNow:yyyy-MM-dd}.csv"
        : $"{fileNamePrefix}.csv";

      return (fileName, stream.ToArray());
    }

    private static class CsvExportColumns<T>
    {
      internal static readonly (PropertyInfo Property, string Name, CsvBooleanValuesAttribute? BooleanValues)[] Columns =
        [.. typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
          .Where(property => property.CanRead && property.GetIndexParameters().Length == 0
            && !property.IsDefined(typeof(CsvIgnoreAttribute)))
          .Select(property => (property, property.GetCustomAttribute<CsvColumnAttribute>()?.Name ?? property.Name,
            property.GetCustomAttribute<CsvBooleanValuesAttribute>()))];
    }
  }
}
