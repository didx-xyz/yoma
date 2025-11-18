using FluentValidation;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public class UnblockRequestValidator : AbstractValidator<UnblockRequest>
  {
    #region Constructor
    public UnblockRequestValidator()
    {
      RuleFor(x => x.UserId)
        .NotEmpty()
        .WithMessage("User Id is required.");

      RuleFor(x => x.Comment)
        .Cascade(CascadeMode.Stop)
        .MaximumLength(400)
        .WithMessage("Comment cannot exceed 400 characters.");
    }
    #endregion
  }
}
