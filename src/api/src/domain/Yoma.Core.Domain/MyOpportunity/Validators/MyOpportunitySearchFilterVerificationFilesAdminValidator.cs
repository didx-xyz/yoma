using FluentValidation;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
  public class MyOpportunitySearchFilterVerificationFilesAdminValidator : PaginationFilterValidator<MyOpportunitySearchFilterVerificationFilesAdmin>
  {
    #region Constructor
    public MyOpportunitySearchFilterVerificationFilesAdminValidator()
    {
      //pagination optional
      RuleFor(x => x.Opportunity).NotEmpty().WithMessage("{PropertyName} contains an empty value.");
      RuleFor(x => x).Custom(ValidateDownloadVerificationTypes);
      RuleFor(x => x.UserId).Must(guid => guid == null || guid != Guid.Empty).WithMessage("{PropertyName} contains an empty value.");
    }
    #endregion

    #region Private Members
    private static void ValidateDownloadVerificationTypes(MyOpportunitySearchFilterVerificationFilesAdmin filter, ValidationContext<MyOpportunitySearchFilterVerificationFilesAdmin> context)
    {
      if (filter.VerificationTypes == null || filter.VerificationTypes.Count == 0)
        return;

      var nonDownloadable = filter.VerificationTypes.Distinct().Except(MyOpportunityService.VerificationTypes_Downloadable).ToArray();

      if (nonDownloadable.Length == 0) return;
      context.AddFailure(nameof(filter.VerificationTypes),
          $"Verification type(s) '{nonDownloadable.JoinNames()}' is not supported / downloadable");
    }
    #endregion
  }
}
