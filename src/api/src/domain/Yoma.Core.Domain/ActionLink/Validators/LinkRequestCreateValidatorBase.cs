using FluentValidation;
using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Validators
{
  public class LinkRequestCreateValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : LinkRequestCreateBase
  {
    #region Public Members
    public LinkRequestCreateValidatorBase()
    {
      RuleFor(x => x.Name).Length(1, 255).When(x => !string.IsNullOrEmpty(x.Name)).WithMessage("'{PropertyName}' must be between 1 and 255 characters long.");
      RuleFor(x => x.Description).Length(1, 500).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("'{PropertyName}' must be between 1 and 500 characters.");
      RuleFor(x => x.EntityId).Must(x => x != Guid.Empty).WithMessage("'{PropertyName}' is required.");
    }
    #endregion
  }
}
