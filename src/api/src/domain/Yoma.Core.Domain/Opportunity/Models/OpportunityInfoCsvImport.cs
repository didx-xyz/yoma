using CsvHelper.Configuration.Attributes;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Core.Converters;

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
  }
}
