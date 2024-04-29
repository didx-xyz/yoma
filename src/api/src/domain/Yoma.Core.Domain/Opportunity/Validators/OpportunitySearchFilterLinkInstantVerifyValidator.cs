using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunitySearchFilterLinkInstantVerifyValidator : PaginationFilterValidator<OpportunitySearchFilterLinkInstantVerify>
  {
    #region Constructor
    public OpportunitySearchFilterLinkInstantVerifyValidator()
    {
      //pagination optional
      RuleFor(x => x.Statuses).Must(x => x == null || x.Count != 0).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Opportunities).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Organizations).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
    }
    #endregion
  }
}
