using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public abstract class UserRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : UserRequestBase
  {
    #region Class Variables
    private readonly IEducationService _educationService;
    private readonly IGenderService _genderService;
    #endregion

    #region Constructor
    public UserRequestValidatorBase(IEducationService educationService,
        IGenderService genderService,
        CoordinatesValidator coordinatesValidator)
    {
      _educationService = educationService ?? throw new ArgumentNullException(nameof(educationService));
      _genderService = genderService ?? throw new ArgumentNullException(nameof(genderService));
      ArgumentNullException.ThrowIfNull(coordinatesValidator);

      RuleFor(x => x.Region)
          .MaximumLength(Constants.Region_MaxLength);

      RuleFor(x => x.City)
          .MaximumLength(Constants.City_MaxLength);

      RuleFor(x => x.LocationSource)
          .IsInEnum()
          .When(x => x.LocationSource.HasValue);

      RuleFor(x => x)
          .Must(x => !string.IsNullOrWhiteSpace(x.Region) || !string.IsNullOrWhiteSpace(x.City) ||
        x.Coordinates == null && x.LocationSource == null)
          .WithMessage("Location metadata requires a region or city.");

      When(x => x.Coordinates != null, () =>
      {
        RuleFor(x => x.City)
            .NotEmpty()
            .WithMessage("City is required when coordinates are specified.");

        RuleFor(x => x.LocationSource)
            .NotEqual(LocationSource.Manual)
            .WithMessage("Manual locations cannot include city-centre coordinates.");

        RuleFor(x => x.Coordinates!)
            .SetValidator(coordinatesValidator);
      });

      RuleFor(x => x.Email)
          .EmailAddress()
          .When(x => !string.IsNullOrEmpty(x.Email))
          .WithMessage("'{PropertyName}' is invalid.");

      RuleFor(x => x.DisplayName)
          .Length(1, 255)
          .When(x => !string.IsNullOrEmpty(x.DisplayName))
          .WithMessage("'Display Name' must be between 1 and 255 characters.");

      RuleFor(x => x.EducationId)
          .Must(EducationExists)
          .WithMessage($"Specified 'Education' is invalid / does not exist.");

      RuleFor(x => x.GenderId)
          .Must(GenderExists)
          .WithMessage($"Specified 'Gender' is invalid / does not exist.");

      RuleFor(x => x.DateOfBirth)
          .Must(NotInFuture)
          .WithMessage("'Date of Birth' is in the future.");
    }
    #endregion

    #region Private Members
    private bool NotInFuture(DateTimeOffset? date)
    {
      if (!date.HasValue) return true;
      return date <= DateTimeOffset.UtcNow;
    }

    private bool EducationExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _educationService.GetByIdOrNull(id.Value) != null;
    }

    private bool GenderExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _genderService.GetByIdOrNull(id.Value) != null;
    }
    #endregion
  }
}
