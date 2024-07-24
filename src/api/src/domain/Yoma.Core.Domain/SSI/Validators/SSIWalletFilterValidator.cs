using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Validators
{
  public class SSIWalletFilterValidator : PaginationFilterValidator<SSIWalletFilter>
  {
    #region Constructor
    public SSIWalletFilterValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => !x.TotalCountOnly).WithMessage("Pagination required");
    }
    #endregion
  }
}
