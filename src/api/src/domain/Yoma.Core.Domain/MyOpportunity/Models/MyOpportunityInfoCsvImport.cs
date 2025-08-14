using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  /// <summary>
  /// CSV import model for my opportunities.
  /// NOTE: Every property in this model must have exactly one CSV header alias:
  /// - Either the property name itself, OR
  /// - A single [Name("HeaderName")] attribute value.
  /// Multiple aliases are not allowed to keep header-to-property mapping simple.
  /// </summary>
  public class MyOpportunityInfoCsvImport
  {
    #region Public Members
    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public string? Gender { get; set; }

    public string? Country { get; set; }

    public DateOnly? DateCompleted { get; set; }

    [Required]
    public string OpporunityExternalId { get; set; }
    #endregion

    #region Internal Members
    internal void ValidateRequired(List<CSVImportErrorRow> errors, int? rowNumber)
    {
      var username = !string.IsNullOrEmpty(Email) ? Email : PhoneNumber;
      if (string.IsNullOrEmpty(username))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, $"{nameof(Email)} or {nameof(PhoneNumber)}");

      if (string.IsNullOrEmpty(OpporunityExternalId))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(OpporunityExternalId));
    }
    #endregion
  }
}
