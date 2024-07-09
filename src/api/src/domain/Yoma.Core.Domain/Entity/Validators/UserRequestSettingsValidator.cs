using FluentValidation;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserRequestSettingsValidator : AbstractValidator<UserRequestSettings>
  {
    #region Constructor
    public UserRequestSettingsValidator()
    {
      RuleFor(x => x.Settings)
         .NotNull().WithMessage("One or more settings required")
         .NotEmpty().WithMessage("One or more settings required")
         .Must(settings => settings.Values.All(value => value != null)).WithMessage("Setting values can be null");
    }
    #endregion
  }
}
