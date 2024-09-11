using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleSearchFilterValidator : PaginationFilterValidator<StoreAccessControlRuleSearchFilter>  
  {
    #region Constructor
    public StoreAccessControlRuleSearchFilterValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
      RuleFor(x => x.NameContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.NameContains));
      RuleFor(x => x.Stores).Must(x => x == null || x.Count == 0 || x.All(id => !string.IsNullOrWhiteSpace(id))).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Organizations).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
    }
    #endregion
  }
}
