using FluentValidation;
using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Validators
{
  public class LinkRequestUpdateStatusValidator : AbstractValidator<LinkRequestUpdateStatus>
  {
    #region Constructor
    public LinkRequestUpdateStatusValidator()
    {
      RuleFor(x => x.Comment).NotEmpty().When(x => x.Status == LinkStatus.Declined).WithMessage($"{{PropertyName}} required when '{LinkStatus.Declined}'.");
    }
    #endregion
  }
}
