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
    public string OpportunityExternalId { get; set; }

    internal string? Username => !string.IsNullOrEmpty(Email) ? Email : PhoneNumber;

    internal string? VerificationEntry
    {
      get
      {
        var parts = new[] { Username, OpportunityExternalId }
            .Where(s => !string.IsNullOrEmpty(s));

        return parts.Any() ? string.Join(", ", parts) : null;
      }
    }
    #endregion

    #region Internal Members
    internal void Validate(List<CSVImportErrorRow> errors, int? rowNumber)
    {
      if (string.IsNullOrEmpty(Username))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, $"{nameof(Username)}: {nameof(Email)} and / or {nameof(PhoneNumber)}");

      if (string.IsNullOrEmpty(OpportunityExternalId))
        CSVImportHelper.AddError(errors, CSVImportErrorType.RequiredFieldMissing, "Missing required field", rowNumber, nameof(OpportunityExternalId));

      if (OpportunityExternalId.Length > 50)
        CSVImportHelper.AddError(errors, CSVImportErrorType.InvalidFieldValue, "Must be between 1 and 50 characters", rowNumber, nameof(OpportunityExternalId), OpportunityExternalId);
    }
    #endregion
  }
}
