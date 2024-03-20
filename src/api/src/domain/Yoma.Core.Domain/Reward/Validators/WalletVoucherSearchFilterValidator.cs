using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Validators
{
  public class WalletVoucherSearchFilterValidator : PaginationFilterValidator<WalletVoucherSearchFilter>
  {
    #region Constructor
    public WalletVoucherSearchFilterValidator()
    {
      //pagination optional
      //categoryId optional
    }
    #endregion
  }
}
