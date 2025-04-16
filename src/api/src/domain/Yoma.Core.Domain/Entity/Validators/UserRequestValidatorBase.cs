using FluentValidation;
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
        IGenderService genderService)
    {
      _educationService = educationService;
      _genderService = genderService;

      RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("'{PropertyName}' is invalid.");
      RuleFor(x => x.DisplayName).Length(1, 255).When(x => !string.IsNullOrEmpty(x.DisplayName)).WithMessage("'Display Name' must be between 1 and 255 characters.");
      RuleFor(x => x.EducationId).Must(EducationExists).WithMessage($"Specified 'Education' is invalid / does not exist.");
      RuleFor(x => x.GenderId).Must(GenderExists).WithMessage($"Specified 'Gender' is invalid / does not exist.");
      RuleFor(x => x.DateOfBirth).Must(NotInFuture).WithMessage("'Date of Birth' is in the future.");
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
