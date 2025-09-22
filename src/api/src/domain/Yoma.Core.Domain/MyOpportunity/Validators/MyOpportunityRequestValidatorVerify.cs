using FluentValidation;
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

      //with instant-verifications start or end date not captured
      RuleFor(x => x)
        .Must(x => x.InstantOrImportedVerification || !(x.DateStart.HasValue && x.CommitmentInterval != null))
        .WithMessage("Either start date or commitment interval (time to complete) must be specified, but not both.");

      RuleFor(x => x.DateStart)
        .NotEmpty()
        .When(x => x.CommitmentInterval == null && !x.InstantOrImportedVerification)
        .WithMessage("Start date is required when the commitment interval (time to complete) is not specified.");

      RuleFor(x => x.CommitmentInterval)
        .NotNull()
        .When(x => !x.DateStart.HasValue && !x.InstantOrImportedVerification)
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
        .When(x => !x.InstantOrImportedVerification)
        .WithMessage("End date (when did you finish) is required")
        .GreaterThanOrEqualTo(x => x.DateStart)
        .When(x => x.DateStart.HasValue)
        .WithMessage("End date (when did you finish) is earlier than the start date");

      RuleFor(x => x.StarRating)
        .InclusiveBetween((byte)1, (byte)5)
        .When(x => x.StarRating.HasValue)
        .WithMessage("Star rating must be between 1 and 5 if specified.");

      RuleFor(x => x.Feedback).Length(1, 500).When(x => !string.IsNullOrEmpty(x.Feedback)).WithMessage("Feedback must be between 1 and 500 characters.");
    }
    #endregion

    #region Private Members
    private bool CommitmentIntervalExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _timeIntervalService.GetByIdOrNull(id) != null;
    }
    #endregion
  }
}
