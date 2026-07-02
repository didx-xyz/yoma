using FluentValidation;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
  public sealed class MyOpportunityRequestValidatorVerifyImportPartnerSync : AbstractValidator<MyOpportunityRequestVerifyImportPartnerSync>
  {
    #region Constructor
    public MyOpportunityRequestValidatorVerifyImportPartnerSync()
    {
      RuleFor(x => x.OpportunityId)
        .NotEmpty()
        .WithMessage("Opportunity id is required.");

      RuleFor(x => x)
        .Must(x => !string.IsNullOrEmpty(x.UserEmail) || !string.IsNullOrEmpty(x.UserPhoneNumber))
        .WithMessage("User email or phone number is required.");

      RuleFor(x => x.DateEnd)
        .GreaterThanOrEqualTo(x => x.DateStart)
        .When(x => x.DateStart.HasValue && x.DateEnd.HasValue)
        .WithMessage("End date cannot be earlier than start date.");

      RuleFor(x => x.CommitmentInterval!.Id)
        .NotEmpty()
        .When(x => x.CommitmentInterval != null)
        .WithMessage("Commitment interval id is required when commitment interval is specified.");

      RuleFor(x => x.CommitmentInterval!.Count)
        .GreaterThanOrEqualTo((short)1)
        .When(x => x.CommitmentInterval != null)
        .WithMessage("Commitment interval count must be greater than or equal to 1.");

      RuleFor(x => x.PercentComplete)
        .InclusiveBetween(0m, 100m)
        .When(x => x.PercentComplete.HasValue)
        .WithMessage("Percent complete must be between 0 and 100 if specified.");

      RuleFor(x => x.DateCompleted)
        .Null()
        .When(x => !x.Completed)
        .WithMessage("Date completed can only be specified when verification is completed.");

      RuleFor(x => x.DateCompleted)
        .GreaterThanOrEqualTo(x => x.DateStart)
        .When(x => x.Completed && x.DateCompleted.HasValue && x.DateStart.HasValue)
        .WithMessage("Date completed cannot be earlier than start date.");
    }
    #endregion
  }
}
