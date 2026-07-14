using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.Configuration.Attributes;
using CsvHelper.TypeConversion;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Reflection;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class CSVImportHelper
  {
    #region Class Variables
    private static readonly ConcurrentDictionary<Type, PropertyInfo[]> _propsCache = new();

    public const string CustomField_Header_Prefix = "CF:";
    public const char Value_Delimiter = '|';
    public const string Boolean_Value_True = "Yes";
    public const string Boolean_Value_False = "No";
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
            p => string.Equals(GetPropertyName(p), fieldName, StringComparison.OrdinalIgnoreCase));

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

    /// <summary>
    /// Validates that the CSV header contains every property defined by the import model.
    /// Optional model values may be blank, but their columns must remain present to keep
    /// the import template consistent. Custom-field columns are dynamic and optional, so
    /// they are validated separately and returned only when present.
    /// </summary>
    public static List<string>? ValidateHeader<TModel>(CsvReader csv, List<CSVImportErrorRow> errors, bool allowCustomFieldHeaders)
    {
      ArgumentNullException.ThrowIfNull(csv, nameof(csv));
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      var modelProps = _propsCache.GetOrAdd(typeof(TModel), t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance));
      var modelHeaders = modelProps.Select(GetPropertyName).ToHashSet(StringComparer.OrdinalIgnoreCase);

      if (!csv.Read() || csv.Context?.Reader?.HeaderRecord?.Length == 0)
      {
        AddError(errors, CSVImportErrorType.HeaderMissing, $"Header row is missing or empty. Expected headers {string.Join(", ", modelHeaders)}", 1);
        return null;
      }

      // Register header mapping before reading data rows.
      csv.ReadHeader();

      var header = (csv.Context?.Reader?.HeaderRecord) ?? throw new InvalidOperationException("Header is missing after reading the header row");
      var customFieldHeaders = allowCustomFieldHeaders
        ? header.Where(IsCustomFieldHeader).ToList()
        : null;
      if (customFieldHeaders?.Count == 0) customFieldHeaders = null;

      // Heuristic: no expected model headers were recognized. Dynamic CF columns alone
      // do not make the fixed import template valid.
      var recognizedCount = header.Count(h => h != null && modelHeaders.Contains(h));
      if (recognizedCount == 0)
      {
        AddError(errors, CSVImportErrorType.HeaderMissing, $"Header row is invalid. Expected headers: {string.Join(", ", modelHeaders)}", 1);
        return customFieldHeaders;
      }

      var headerSet = header.ToHashSet(StringComparer.OrdinalIgnoreCase);

      // Duplicate columns in header.
      var duplicates = header
        .GroupBy(h => h ?? string.Empty, StringComparer.OrdinalIgnoreCase)
        .Where(g => g.Count() > 1)
        .Select(g => g.Key)
        .ToList();
      duplicates.ForEach(o => AddError(errors, CSVImportErrorType.HeaderDuplicateColumn, "Duplicate column defined in the header", 1, o));

      // Unexpected columns in header. Dynamic CF columns are validated against active
      // definitions separately because they are not properties on the fixed import DTO.
      headerSet
        .Where(h => !modelHeaders.Contains(h) && !(allowCustomFieldHeaders && IsCustomFieldHeader(h)))
        .ToList()
        .ForEach(h => AddError(errors, CSVImportErrorType.HeaderUnexpectedColumn, "Unexpected column defined in the header", 1, h));

      // Missing ANY model property in header.
      modelHeaders
        .Where(h => !headerSet.Contains(h))
        .ToList()
        .ForEach(h => AddError(errors, CSVImportErrorType.HeaderColumnMissing, "Header column missing", 1, h));

      return customFieldHeaders;
    }

    public static Dictionary<string, string>? ResolveCustomFieldHeaders(
      CustomFieldEntityType entityType,
      List<string>? headers,
      ICustomFieldDefinitionService customFieldDefinitionService,
      List<CSVImportErrorRow> errors)
    {
      ArgumentNullException.ThrowIfNull(customFieldDefinitionService, nameof(customFieldDefinitionService));
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      if (headers == null || headers.Count == 0) return null;

      var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
      var resolvedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

      foreach (var header in headers)
      {
        var key = header[CustomField_Header_Prefix.Length..];
        if (string.IsNullOrEmpty(key))
        {
          AddError(errors, CSVImportErrorType.HeaderUnexpectedColumn, "Custom field key is missing", 1, header);
          continue;
        }

        // Keep the template format deterministic and spreadsheet-friendly:
        // CF:<DefinitionKey>, for example CF:WorkArrangement, with no whitespace.
        if (key.Any(char.IsWhiteSpace))
        {
          AddError(errors, CSVImportErrorType.HeaderUnexpectedColumn, "Custom field columns must use the format CF:<Key> without spaces", 1, header);
          continue;
        }

        CustomFieldDefinition definition;
        try
        {
          definition = customFieldDefinitionService.GetByKey(entityType, key, true, true);
        }
        catch (EntityNotFoundException)
        {
          AddError(errors, CSVImportErrorType.HeaderUnexpectedColumn, "Active custom field definition does not exist", 1, header);
          continue;
        }

        // Different header spellings must not resolve to the same case-insensitive key.
        if (!resolvedKeys.Add(definition.Key))
        {
          AddError(errors, CSVImportErrorType.HeaderDuplicateColumn, "Duplicate custom field column defined in the header", 1, header);
          continue;
        }

        result.Add(header, definition.Key);
      }

      return result.Count == 0 ? null : result;
    }

    public static Dictionary<string, string?>? ReadCustomFieldValues(
      CsvReader csv,
      IReadOnlyDictionary<string, string>? columns)
    {
      ArgumentNullException.ThrowIfNull(csv, nameof(csv));

      if (columns == null || columns.Count == 0) return null;

      var result = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
      foreach (var column in columns)
      {
        var value = csv.GetField(column.Key)?.Trim();
        result.Add(column.Value, string.IsNullOrEmpty(value) ? null : value);
      }

      return result;
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
    private static bool IsCustomFieldHeader(string? header)
    {
      return header?.StartsWith(CustomField_Header_Prefix, StringComparison.OrdinalIgnoreCase) == true;
    }

    private static string GetPropertyName(PropertyInfo prop)
    {
      return prop.GetCustomAttributes(typeof(NameAttribute), true)
        .Cast<NameAttribute>()
        .FirstOrDefault()?.Names.FirstOrDefault() ?? prop.Name;
    }
    #endregion
  }
}
