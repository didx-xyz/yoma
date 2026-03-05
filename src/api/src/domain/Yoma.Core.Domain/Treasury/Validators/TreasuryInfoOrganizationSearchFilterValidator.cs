using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Domain.Treasury.Validators
{
  public sealed class TreasuryInfoOrganizationSearchFilterValidator : PaginationFilterValidator<TreasuryInfoOrganizationSearchFilter>
  {
    #region Constructor
    public TreasuryInfoOrganizationSearchFilterValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
    }
    #endregion
  }
}
