using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Validators
{
    public class SSIWalletFilterValidator : PaginationFilterValidator<SSIWalletFilter>
    {
        #region Constructor
        public SSIWalletFilterValidator()
        {
            //pagination optional
        }
        #endregion
    }
}
