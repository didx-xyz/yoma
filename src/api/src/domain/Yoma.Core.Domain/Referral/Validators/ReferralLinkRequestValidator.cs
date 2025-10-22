using FluentValidation;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public abstract class ReferralLinkRequestValidator<TRequest> : AbstractValidator<TRequest>
        where TRequest : ReferralLinkRequestBase
  {
    #region Constructor
    public ReferralLinkRequestValidator()
    {
      RuleFor(x => x.Name)
        .Cascade(CascadeMode.Stop)
        .NotEmpty()
        .Length(1, 150)
        .WithMessage("Please enter a program name (maximum 150 characters).");

      RuleFor(x => x.Description)
        .Cascade(CascadeMode.Stop)
        .Length(1, 500)
        .When(x => !string.IsNullOrWhiteSpace(x.Description))
        .WithMessage("The description cannot be longer than 500 characters.");
    }
    #endregion
  }

  public class ReferralLinkRequestCreateValidator : ReferralLinkRequestValidator<ReferralLinkRequestCreate>
  {
    #region Constructor
    public ReferralLinkRequestCreateValidator()
    {
      RuleFor(x => x.ProgramId).NotEmpty().WithMessage("Program Id is required.");
    }
    #endregion
  }

  public class ReferralLinkRequestUpdateValidator : ReferralLinkRequestValidator<ReferralLinkRequestUpdate>
  {
    #region Constructor
    public ReferralLinkRequestUpdateValidator()
    {
      RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required.");
    }
    #endregion
  }
}
