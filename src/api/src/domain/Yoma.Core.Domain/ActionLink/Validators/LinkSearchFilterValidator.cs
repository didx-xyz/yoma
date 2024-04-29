using FluentValidation;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Validators;

namespace Yoma.Core.Domain.ActionLink.Validators
{
  public class LinkSearchFilterValidator : PaginationFilterValidator<LinkSearchFilter>
  {
    #region Constructor
    public LinkSearchFilterValidator()
    {
      //pagination optional
      RuleFor(x => x.Statuses).Must(x => x == null || x.Count != 0).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Entities).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.EntityParents).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
    }
    #endregion
  }
}
