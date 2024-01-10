using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Validators
{
    public class StoreSearchFilterValidator : PaginationFilterValidator<StoreSearchFilter>
    {
        #region Constructor
        public StoreSearchFilterValidator()
        {
            //pagination optional
            //categoryId optional
        }
        #endregion
    }
}
