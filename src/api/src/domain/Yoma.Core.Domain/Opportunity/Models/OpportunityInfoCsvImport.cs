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
    public string Title { get; set; } = null!;

    [Required]
    public string Type { get; set; } = null!;

    public string? Engagement { get; set; }

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    public List<string>? Categories { get; set; }

    [Name("Link")]
    public string? URL { get; set; }

    [Required]
    public string Summary { get; set; } = null!;

    [Required]
    public string Description { get; set; } = null!;

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    public List<string>? Languages { get; set; }

    [Required]
    [TypeConverter(typeof(CsvDelimitedStringConverter))]
    [Name("Location")]
    public List<string>? Countries { get; set; }

    public string? Difficulty { get; set; }

    [Name("EffortCount")]
    public short? CommitmentIntervalCount { get; set; }

    [Name("EffortInterval")]
    public string? CommitmentInterval { get; set; }

    [Required]
    public DateOnly DateStart { get; set; }

    public DateOnly? DateEnd { get; set; }

    public int? ParticipantLimit { get; set; }

    public decimal? ZltoReward { get; set; }

    public decimal? ZltoRewardPool { get; set; }

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
    public string ExternalId { get; set; } = null!;
    #endregion

    #region Internal Members
    internal void Validate(List<CSVImportErrorRow> errors, int? rowNumber)
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
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, "Location");

      // Engagement
      // Optional for all opportunity types.
      // Validation of the supplied value has been moved to the domain validators during Create/Update.

      // Difficulty
      // Optional for Opportunity Type: Job.
      // For other opportunity types this field is required.
      // Validation has been moved to the domain validators during Create/Update to keep CSV import aligned with API validation rules.

      // EffortCount (CommitmentIntervalCount)
      // Optional for Opportunity Type: Job.
      // For other opportunity types this field is required and must be greater than 0.
      // Domain validators enforce this rule.
      // CSV import only validates the numeric constraint when the field is supplied.
      if (CommitmentIntervalCount.HasValue && CommitmentIntervalCount <= 0)
        CSVImportHelper.AddError(errors, CSVImportErrorType.InvalidFieldValue, "Must be greater than 0", rowNumber, "EffortCount", CommitmentIntervalCount.Value.ToString());

      // EffortInterval (CommitmentInterval)
      // Optional for Opportunity Type: Job.
      // For other opportunity types this field is required.
      // Validation has been moved to the domain validators during Create/Update.

      if (DateStart == DateOnly.MinValue)
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(DateStart));

      // Skills are optional. If specified, they must not contain empty values.
      if (Skills != null && Skills.Any(string.IsNullOrWhiteSpace))
        CSVImportHelper.AddError(errors, CSVImportErrorType.InvalidFieldValue, "Invalid value", rowNumber, nameof(Skills));

      if (Keywords == null || !Keywords.Any(name => !string.IsNullOrWhiteSpace(name)))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(Keywords));

      if (string.IsNullOrEmpty(ExternalId))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(ExternalId));

      if (ExternalId.Length > 50)
        CSVImportHelper.AddError(errors, CSVImportErrorType.InvalidFieldValue, "Must be between 1 and 50 characters", rowNumber, nameof(ExternalId), ExternalId);
    }
    #endregion
  }
}
