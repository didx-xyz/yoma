using FluentValidation;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
  public class MyOpportunitySearchFilterVerificationFilesValidator : AbstractValidator<MyOpportunitySearchFilterVerificationFiles>
  {
    #region Constructor
    public MyOpportunitySearchFilterVerificationFilesValidator()
    {
      RuleFor(x => x.Opportunity).NotEmpty().WithMessage("{PropertyName} contains an empty value.");
      RuleFor(x => x).Custom(ValidateDownloadVerificationTypes);
    }
    #endregion

    #region Private Members
    private static void ValidateDownloadVerificationTypes(MyOpportunitySearchFilterVerificationFiles filter, ValidationContext<MyOpportunitySearchFilterVerificationFiles> context)
    {
      if (filter.VerificationTypes == null || filter.VerificationTypes.Count == 0)
        return;

      var nonDownloadable = filter.VerificationTypes.Except(MyOpportunityService.VerificationTypes_Downloadable).ToList();

      if (nonDownloadable.Count == 0) return;
      context.AddFailure(nameof(filter.VerificationTypes),
          $"Verification type(s) '{string.Join(", ", nonDownloadable)}' is not supported / downloadable");
    }
    #endregion
  }
}
