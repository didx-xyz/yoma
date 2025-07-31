using FluentValidation;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Validators;

namespace Yoma.Core.Domain.ActionLink.Validators
{
  public class LinkSearchFilterUsageValidator : PaginationFilterValidator<LinkSearchFilterUsage>
  {
    #region Constructor
    public LinkSearchFilterUsageValidator()
    {
      RuleFor(x => x.Id).Must(guid => guid != Guid.Empty).WithMessage("{PropertyName} contains an empty value.");
      RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
    }
    #endregion
  }
}
