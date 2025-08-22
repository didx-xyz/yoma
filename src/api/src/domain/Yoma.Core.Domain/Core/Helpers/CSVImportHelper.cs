using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.Configuration.Attributes;
using CsvHelper.TypeConversion;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Reflection;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class CSVImportHelper
  {
    #region Class Variables
    private static readonly ConcurrentDictionary<Type, PropertyInfo[]> _propsCache = new();
    #endregion

    #region Public Members
    public static CsvConfiguration CreateConfig<TModel>(List<CSVImportErrorRow> errors)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      var modelProps = _propsCache.GetOrAdd(typeof(TModel), t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance));

      return new CsvConfiguration(CultureInfo.InvariantCulture)
      {
        Delimiter = ",",
        HasHeaderRecord = true,
        TrimOptions = TrimOptions.Trim,
        IgnoreBlankLines = true,
        PrepareHeaderForMatch = args => (args.Header ?? string.Empty).Trim(),

        MissingFieldFound = args =>
        {
          // Exactly one alias per property: property name OR single [Name("...")].
          var fieldName = args.HeaderNames?.FirstOrDefault();
          if (fieldName == null) return;

          var property = modelProps.FirstOrDefault(
            p => string.Equals(GetPropertyName(p), fieldName, StringComparison.InvariantCultureIgnoreCase));

          // Defensive no-op if header name doesn't map to a property.
          if (property == null) return;

          var isRequired = property.GetCustomAttributes(typeof(RequiredAttribute), true).Length > 0;
          if (isRequired)
            AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", args.Context?.Parser?.Row, fieldName);
        },

        BadDataFound = args =>
        {
          var colIndex = args.Context?.Reader?.CurrentIndex;
          string? fieldName = null;

          if (colIndex.HasValue)
          {
            var header = args.Context?.Reader?.HeaderRecord;
            if (header != null && colIndex.Value < header.Length)
              fieldName = header[colIndex.Value];
          }

          var message = "Invalid value";
          if (string.IsNullOrEmpty(fieldName) && colIndex.HasValue)
            message = $"Invalid value in column index {colIndex.Value}";

          AddError(errors, CSVImportErrorType.InvalidFieldValue, message, args.Context?.Parser?.Row, fieldName, args.Field);
        }
      };
    }

    public static void ValidateHeader<TModel>(CsvReader csv, List<CSVImportErrorRow> errors)
    {
      ArgumentNullException.ThrowIfNull(csv, nameof(csv));
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      if (!csv.Read() || csv.Context?.Reader?.HeaderRecord?.Length == 0)
      {
        AddError(errors, CSVImportErrorType.HeaderMissing, "The header row is missing", 1);
        return;
      }

      // Register header mapping before reading data rows
      csv.ReadHeader();

      var header = (csv.Context?.Reader?.HeaderRecord) ?? throw new InvalidOperationException("CSV header is missing after reading the header row");

      var modelProps = _propsCache.GetOrAdd(typeof(TModel), t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance));
      var modelHeaders = modelProps.Select(GetPropertyName).ToHashSet(StringComparer.InvariantCultureIgnoreCase);

      // Heuristic: if none of the parsed "headers" match expected model headers,
      // the header was probably deleted and the first data row was treated as header.
      var recognizedCount = header.Count(h => h != null && modelHeaders.Contains(h));
      if (recognizedCount == 0)
      {
        AddError(errors, CSVImportErrorType.HeaderMissing, "Header row appears to be missing — the first row does not look like a valid header and may instead be a record or incorrectly formatted", 1);
        return;
      }

      var headerSet = header.ToHashSet(StringComparer.InvariantCultureIgnoreCase);

      // Duplicate columns in header
      var duplicates = header
          .GroupBy(h => h ?? string.Empty, StringComparer.InvariantCultureIgnoreCase)
          .Where(g => g.Count() > 1)
          .Select(g => g.Key).ToList();
      duplicates.ForEach(o => AddError(errors, CSVImportErrorType.HeaderDuplicateColumn, "Duplicate column defined in the header", 1, o));

      // Unexpected columns in header
      headerSet.Where(h => !modelHeaders.Contains(h)).ToList().ForEach(h => AddError(errors, CSVImportErrorType.HeaderUnexpectedColumn, "Unexpected column defined in the header", 1, h));

      // Missing ANY model property in header
      modelHeaders.Where(h => !headerSet.Contains(h)).ToList().ForEach(h => AddError(errors, CSVImportErrorType.HeaderColumnMissing, "Header column missing", 1, h));
    }

    public static CSVImportResult GetResults(List<CSVImportErrorRow> errors)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      var orderedErrors = errors.OrderBy(e => e.Number ?? int.MaxValue).ToList();
      foreach (var item in orderedErrors)
        item.Items = [.. item.Items.OrderBy(i => (int)i.Type)];

      if (!ContainsHeaderErrors(orderedErrors))
        throw new InvalidOperationException("Header-only failed result. Header errors expected");

      return new CSVImportResult { Imported = false, HeaderErrors = true, Errors = orderedErrors };
    }

    public static CSVImportResult GetResults(List<CSVImportErrorRow> errors, int recordsTotal, bool? validateOnly)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      var orderedErrors = errors.OrderBy(e => e.Number ?? int.MaxValue).ToList();
      foreach (var item in orderedErrors)
        item.Items = [.. item.Items.OrderBy(i => (int)i.Type)];

      if (ContainsHeaderErrors(orderedErrors))
        throw new InvalidOperationException("Data rows result. No header errors expected");

      var recordsFailed = orderedErrors.Count(e => e.Number.HasValue);

      return new CSVImportResult
      {
        Imported = validateOnly != true && orderedErrors.Count == 0, // null or false => import when no errors
        HeaderErrors = false,
        RecordsTotal = recordsTotal,
        RecordsFailed = recordsFailed,
        RecordsSucceeded = Math.Max(0, recordsTotal - recordsFailed),
        Errors = orderedErrors.Count == 0 ? null : orderedErrors
      };
    }

    public static bool ContainsHeaderErrors(List<CSVImportErrorRow> errors)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      return errors.Any(r => r.Items.Any(i =>
        i.Type == CSVImportErrorType.HeaderMissing ||
        i.Type == CSVImportErrorType.HeaderDuplicateColumn ||
        i.Type == CSVImportErrorType.HeaderUnexpectedColumn ||
        i.Type == CSVImportErrorType.HeaderColumnMissing));
    }

    public static bool ContainsFieldErrors(List<CSVImportErrorRow> errors, int rowNumber)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(rowNumber);

      return errors.Any(r => r.Number == rowNumber && r.Items.Any(i =>
        i.Type == CSVImportErrorType.RequiredFieldMissing ||
        i.Type == CSVImportErrorType.InvalidFieldValue));
    }

    public static void AddError(List<CSVImportErrorRow> errors, CSVImportErrorType type, string message, int? rowNumber = null,
      string? field = null, string? value = null)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      message = message.Trim();
      ArgumentException.ThrowIfNullOrEmpty(message, nameof(message));

      if (rowNumber.HasValue && rowNumber <= 0) rowNumber = null;

      field = field?.Trim();
      if (string.IsNullOrEmpty(field)) field = null;

      value = value?.Trim();
      if (string.IsNullOrEmpty(value)) value = null;

      var row = errors.FirstOrDefault(r => r.Number == rowNumber);
      if (row == null)
      {
        row = new CSVImportErrorRow { Number = rowNumber, Items = [] };
        errors.Add(row);
      }

      row.Items.Add(new CSVImportErrorItem { Type = type, TypeDescription = type.ToDescription(), Message = message, Field = field, Value = value });
    }

    public static void HandleExceptions(Exception ex, List<CSVImportErrorRow> errors, int rowNumber)
    {
      ArgumentNullException.ThrowIfNull(ex, nameof(ex));

      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(rowNumber);

      switch (ex)
      {
        case TypeConverterException typeEx:
          {
            var fieldName = typeEx.MemberMapData?.Names?.FirstOrDefault();
            var fieldValue = typeEx.Text;

            AddError(errors, CSVImportErrorType.InvalidFieldValue, $"Invalid value", rowNumber, fieldName, fieldValue);

            break;
          }

        case ReaderException readerEx:
          {
            var context = readerEx.Context?.Reader;
            var index = context?.CurrentIndex ?? -1;
            var header = context?.HeaderRecord;

            var fieldName = (index >= 0 && header != null && index < header.Length)
                ? header[index]
                : "Unknown";

            string? fieldValue = null;
            var record = context?.Parser?.Record;
            if (record != null && index >= 0 && index < record.Length)
              fieldValue = record[index];

            AddError(errors, CSVImportErrorType.InvalidFieldValue, "Invalid value", rowNumber, fieldName, fieldValue);
            break;
          }

        default:
          AddError(errors, CSVImportErrorType.ProcessingError, ex.Message, rowNumber);

          break;
      }
    }
    #endregion

    #region Private Members
    private static string GetPropertyName(PropertyInfo prop)
    {
      return prop.GetCustomAttributes(typeof(NameAttribute), true)
        .Cast<NameAttribute>()
        .FirstOrDefault()?.Names.FirstOrDefault() ?? prop.Name;
    }
    #endregion
  }
}
