using FluentValidation;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
  public class MyOpportunityRequestValidatorVerify : AbstractValidator<MyOpportunityRequestVerify>
  {
    #region Class Variables
    private readonly ITimeIntervalService _timeIntervalService;
    #endregion

    #region Constructor
    public MyOpportunityRequestValidatorVerify(ITimeIntervalService timeIntervalService)
    {
      _timeIntervalService = timeIntervalService;

      RuleFor(x => x.Certificate).Must(file => file == null || file.Length > 0).WithMessage("{PropertyName} is optional, but if specified, cannot be empty.");
      RuleFor(x => x.VoiceNote).Must(file => file == null || file.Length > 0).WithMessage("{PropertyName} is optional, but if specified, cannot be empty.");
      RuleFor(x => x.Picture).Must(file => file == null || file.Length > 0).WithMessage("{PropertyName} is optional, but if specified, cannot be empty.");
      RuleFor(x => x.Video).Must(file => file == null || file.Length > 0).WithMessage("{PropertyName} is optional, but if specified, cannot be empty.");
      RuleFor(x => x.Geometry)
          .Must(x => x == null || (x.Coordinates != null && x.Coordinates.Count > 0))
          .WithMessage("Geometry is optional, but if specified, coordinates must contain at least one coordinate set.")
          .When(x => x.Geometry != null && x.Geometry.Type != Core.SpatialType.None);
      RuleFor(x => x.Geometry)
          .Must(x => x == null || (x.Coordinates != null && x.Coordinates.All(coordinate => coordinate.Length >= 3)))
          .WithMessage("3 or more coordinate points expected per coordinate set i.e. Point: X-coordinate (longitude -180 to +180), Y-coordinate (latitude -90 to +90), Z-elevation.")
          .When(x => x.Geometry != null && x.Geometry.Type != Core.SpatialType.None);

      // Auto-finalized verifications are completed by instant, imported or partner-synced flows.
      // These flows do not require the user-facing start/end date and commitment interval inputs.
      RuleFor(x => x)
        .Must((_, model, context) => AutoFinalizedVerification(context) || !(model.DateStart.HasValue && model.CommitmentInterval != null))
        .WithMessage("Either start date or commitment interval (time to complete) must be specified, but not both.");

      RuleFor(x => x.DateStart)
        .NotEmpty()
        .When((model, context) => model.CommitmentInterval == null && !AutoFinalizedVerification(context))
        .WithMessage("Start date is required when the commitment interval (time to complete) is not specified.");

      RuleFor(x => x.CommitmentInterval)
        .NotNull()
        .When((model, context) => !model.DateStart.HasValue && !AutoFinalizedVerification(context))
        .WithMessage("Commitment interval (time to complete) is required when start date is not specified.")
        .DependentRules(() =>
        {
          RuleFor(x => x.CommitmentInterval!.Id)
            .Must(id => id != Guid.Empty && CommitmentIntervalExists(id))
            .WithMessage("Commitment interval is empty or does not exist.")
            .When(x => x.CommitmentInterval != null);

          RuleFor(x => x.CommitmentInterval!.Count)
            .GreaterThanOrEqualTo((short)1)
            .WithMessage("Commitment interval count must be greater than or equal to 1.")
            .When(x => x.CommitmentInterval != null);
        });

      RuleFor(x => x.DateEnd)
        .NotEmpty()
        .When((_, context) => !AutoFinalizedVerification(context))
        .WithMessage("End date (when did you finish) is required")
        .GreaterThanOrEqualTo(x => x.DateStart)
        .When(x => x.DateStart.HasValue)
        .WithMessage("End date (when did you finish) is earlier than the start date");

      RuleFor(x => x.PercentComplete)
        .InclusiveBetween(0m, 100m)
        .When(x => x.PercentComplete.HasValue)
        .WithMessage("Percent complete must be between 0 and 100 if specified.");

      RuleFor(x => x.StarRating)
        .InclusiveBetween((byte)1, (byte)5)
        .When(x => x.StarRating.HasValue)
        .WithMessage("Star rating must be between 1 and 5 if specified.");

      RuleFor(x => x.Feedback).Length(1, 500).When(x => !string.IsNullOrEmpty(x.Feedback)).WithMessage("Feedback must be between 1 and 500 characters.");

      RuleFor(x => x.CustomFields)
        .Must(CustomFieldKeysUnique)
        .WithMessage("Custom field keys must be unique.");

      RuleForEach(x => x.CustomFields).ChildRules(field =>
      {
        field.RuleFor(x => x.Key)
          .NotEmpty()
          .WithMessage("Custom field key is required.");

        field.RuleFor(x => x)
          .Must(CustomFieldValueSpecified)
          .WithMessage("Custom field must specify exactly one of value or values; values must contain at least one item.");

        field.RuleFor(x => x.Value)
          .Must(value => string.IsNullOrWhiteSpace(value) || !value.Contains(CustomFieldValue.Value_Delimiter))
          .WithMessage("Custom field value contains an invalid delimiter character.");

        field.RuleFor(x => x.Values)
          .Must(values => values == null || values.All(value => !string.IsNullOrWhiteSpace(value) && !value.Contains(CustomFieldValue.Value_Delimiter)))
          .WithMessage("Custom field values contain empty values or invalid delimiter characters.");
      });
    }
    #endregion

    #region Private Members
    private static bool AutoFinalizedVerification(ValidationContext<MyOpportunityRequestVerify> context)
    {
      return context.RootContextData.TryGetValue(nameof(MyOpportunityVerificationOptions.AutoFinalizedVerification), out var value) &&
        value is true;
    }

    private bool CommitmentIntervalExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _timeIntervalService.GetByIdOrNull(id) != null;
    }

    private static bool CustomFieldKeysUnique(List<CustomFieldValueRequest>? customFields)
    {
      if (customFields == null) return true;

      var keys = customFields
        .Where(o => !string.IsNullOrWhiteSpace(o.Key))
        .Select(o => o.Key.Trim())
        .ToList();

      return keys.Count == keys.Distinct(StringComparer.OrdinalIgnoreCase).Count();
    }

    private static bool CustomFieldValueSpecified(CustomFieldValueRequest customField)
    {
      var hasValue = !string.IsNullOrWhiteSpace(customField.Value);
      var hasValues = customField.Values != null;

      // PATCH normalizes a key-only item into an explicit deletion. It is valid only
      // when neither scalar nor option values were supplied with the deletion request.
      if (customField.Delete)
        return !hasValue && (!hasValues || customField.Values!.Count == 0);

      // A normal item must use exactly one value representation: Value for scalar
      // fields or a non-empty Values collection for option fields.
      return hasValue != hasValues && (!hasValues || customField.Values!.Count != 0);
    }
    #endregion
  }
}
