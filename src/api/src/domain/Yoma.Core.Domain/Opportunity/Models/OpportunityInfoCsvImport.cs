using CsvHelper.Configuration.Attributes;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Converters;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  /// <summary>
  /// CSV import model for opportunities.
  /// NOTE: Every property in this model must have exactly one CSV header alias:
  /// - Either the property name itself, OR
  /// - A single [Name("HeaderName")] attribute value.
  /// Multiple aliases are not allowed to keep header-to-property mapping simple.
  /// </summary>
  public class OpportunityInfoCsvImport
  {
    #region Public Members
    [Required]
    public string Title { get; set; }

    [Required]
    public string Type { get; set; }

    public string? Engagement { get; set; }

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    public List<string>? Categories { get; set; }

    [Name("Link")]
    public string? URL { get; set; }

    [Required]
    public string Summary { get; set; }

    [Required]
    public string Description { get; set; }

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    public List<string>? Languages { get; set; }

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    [Name("Location")]
    public List<string>? Countries { get; set; }

    [Required]
    public string Difficulty { get; set; }

    [Required]
    [Name("EffortCount")]
    public short CommitmentIntervalCount { get; set; }

    [Required]
    [Name("EffortInterval")]
    public string CommitmentInterval { get; set; }

    [Required]
    public DateOnly DateStart { get; set; }

    public DateOnly? DateEnd { get; set; }

    public int? ParticipantLimit { get; set; }

    public decimal? ZltoReward { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    public List<string>? Skills { get; set; }

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    public List<string>? Keywords { get; set; }

    [Required]
    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool Hidden { get; set; }

    [Required]
    public string ExternalId { get; set; }
    #endregion

    #region Internal Members
    internal void ValidateRequired(List<CSVImportErrorRow> errors, int? rowNumber)
    {
      ArgumentNullException.ThrowIfNull(errors, nameof(errors));

      if (string.IsNullOrEmpty(Title))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Title));

      if (string.IsNullOrEmpty(Type))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Type));

      if (Categories == null || !Categories.Any(name => !string.IsNullOrWhiteSpace(name)))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Categories));

      if (string.IsNullOrEmpty(Summary))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Summary));

      if (string.IsNullOrEmpty(Description))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Description));

      if (Languages == null || !Languages.Any(name => !string.IsNullOrWhiteSpace(name)))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Languages));

      if (Countries == null || !Countries.Any(name => !string.IsNullOrWhiteSpace(name)))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Countries));

      if (string.IsNullOrEmpty(Difficulty))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Difficulty));

      if (CommitmentIntervalCount <= 0)
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(CommitmentIntervalCount));

      if (string.IsNullOrEmpty(CommitmentInterval))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(CommitmentInterval));

      if (DateStart == DateOnly.MinValue)
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(DateStart));

      if (Skills == null || !Skills.Any(name => !string.IsNullOrWhiteSpace(name)))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Skills));

      if (Keywords == null || !Keywords.Any(name => !string.IsNullOrWhiteSpace(name)))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Keywords));

      if (string.IsNullOrEmpty(ExternalId))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(ExternalId));
    }
    #endregion
  }
}
