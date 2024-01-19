using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Validators
{
    public class StoreItemCategorySearchFilterValidator : PaginationFilterValidator<StoreItemCategorySearchFilter>
    {
        #region Constructor
        public StoreItemCategorySearchFilterValidator()
        {
            //pagination optional
            RuleFor(x => x.StoreId).NotEmpty().WithMessage("{PropertyName} is required");
        }
        #endregion
    }
}
