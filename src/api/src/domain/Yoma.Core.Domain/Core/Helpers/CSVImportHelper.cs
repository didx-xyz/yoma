using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.Configuration.Attributes;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Reflection;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class CSVImportHelper
  {
    #region Class Variables
    private static readonly ConcurrentDictionary<System.Type, PropertyInfo[]> _propsCache = new();
    #endregion

    #region Public Members
    public static CsvConfiguration CreateConfig<TModel>(List<CSVImportError> errors)
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
          if (args.Context?.Reader?.HeaderRecord == null)
          {
            errors.Add(new CSVImportError
            {
              Row = 1,
              Type = CSVImportErrorType.HeaderMissing,
              Message = "The header row is missing"
            });
            return;
          }

          // Exactly one alias per property: property name OR single [Name("...")].
          var fieldName = args.HeaderNames?.FirstOrDefault();
          if (fieldName == null) return;

          var property = modelProps.FirstOrDefault(
            p => string.Equals(GetPropertyName(p), fieldName, StringComparison.InvariantCultureIgnoreCase));

          // Defensive no-op if header name doesn't map to a property.
          if (property == null) return;

          var isRequired = property.GetCustomAttributes(typeof(RequiredAttribute), true).Length > 0;
          if (isRequired)
          {
            var row = args.Context?.Parser?.Row;
            errors.Add(new CSVImportError
            {
              Row = row.HasValue ? row.Value : null,
              Type = CSVImportErrorType.RequiredFieldMissing,
              Message = "Missing required field",
              Field = fieldName
            });
          }
        },

        BadDataFound = args =>
        {
          var row = args.Context?.Parser?.Row;
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

          errors.Add(new CSVImportError
          {
            Row = row.HasValue ? row.Value : null,
            Type = CSVImportErrorType.InvalidFieldValue,
            Message = message,
            Field = fieldName,
            Value = args.Field
          });
        }
      };
    }

    public static void ValidateHeader<TModel>(CsvReader csv, List<CSVImportError> errors)
    {
      ArgumentNullException.ThrowIfNull(csv, nameof(csv));
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      if (!csv.Read() || csv.Context?.Reader?.HeaderRecord == null)
      {
        errors.Add(new CSVImportError
        {
          Row = 1,
          Type = CSVImportErrorType.HeaderMissing,
          Message = "The header row is missing"
        });
        return;
      }

      var modelProps = _propsCache.GetOrAdd(typeof(TModel), t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance));
      var modelHeaders = modelProps.Select(GetPropertyName).ToHashSet(StringComparer.InvariantCultureIgnoreCase);

      var header = csv.Context.Reader.HeaderRecord;
      var headerSet = header.ToHashSet(StringComparer.InvariantCultureIgnoreCase);

      // Duplicate columns in header
      var duplicates = header
          .GroupBy(h => h ?? string.Empty, StringComparer.InvariantCultureIgnoreCase)
          .Where(g => g.Count() > 1)
          .Select(g => g.Key);

      foreach (var dup in duplicates)
      {
        errors.Add(new CSVImportError
        {
          Row = 1,
          Type = CSVImportErrorType.HeaderDuplicateColumn,
          Message = "Duplicate column defined in the header",
          Field = dup
        });
      }

      // Unexpected columns in header
      foreach (var h in headerSet)
      {
        if (!modelHeaders.Contains(h))
        {
          errors.Add(new CSVImportError
          {
            Row = 1,
            Type = CSVImportErrorType.HeaderUnexpectedColumn,
            Message = "Unexpected column defined in the header",
            Field = h
          });
        }
      }

      // Missing ANY model property in header
      foreach (var expected in modelHeaders)
      {
        if (!headerSet.Contains(expected))
        {
          errors.Add(new CSVImportError
          {
            Row = 1,
            Type = CSVImportErrorType.HeaderColumnMissing,
            Message = "Header column missing",
            Field = expected
          });
        }
      }
    }

    public static CSVImportResult GetResults(List<CSVImportError> errors, int? rowsTotal)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      var failed = errors.Count;
      var succeeded = failed == 0;
      var total = rowsTotal ?? 0;

      return new CSVImportResult
      {
        Succeeded = succeeded,
        RowsTotal = total,
        RowsSucceeded = succeeded ? total : Math.Max(0, total - failed),
        RowsFailed = failed,
        Errors = errors
      };
    }

    public static bool ContainsHeaderErrors(List<CSVImportError> errors)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      return errors.Any(e => e.Type == CSVImportErrorType.HeaderMissing ||
                            e.Type == CSVImportErrorType.HeaderDuplicateColumn ||
                            e.Type == CSVImportErrorType.HeaderUnexpectedColumn ||
                            e.Type == CSVImportErrorType.HeaderColumnMissing);
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
