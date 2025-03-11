using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Validators
{
  public class SSIWalletSearchFilterValidator : PaginationFilterValidator<SSIWalletSearchFilter>
  {
    #region Constructor
    public SSIWalletSearchFilterValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => !x.TotalCountOnly).WithMessage("Pagination required");
    }
    #endregion
  }
}
