using FluentValidation;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class SettingsRequestValidator : AbstractValidator<SettingsRequest>
  {
    #region Constructor
    public SettingsRequestValidator()
    {
      RuleFor(x => x.Settings)
        .NotEmpty().WithMessage("One or more 'Settings' are required.")
        .DependentRules(() =>
        {
          RuleFor(x => x.Settings)
          .Must(s => s.Values.All(v => v != null))
          .WithMessage("'Setting' values must be non-null.");
        });
    }
    #endregion
  }
}
