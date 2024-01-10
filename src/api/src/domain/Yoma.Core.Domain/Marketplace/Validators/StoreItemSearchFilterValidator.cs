using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Validators
{
    public class StoreItemSearchFilterValidator : PaginationFilterValidator<StoreItemSearchFilter>
    {
        #region Constructor
        public StoreItemSearchFilterValidator()
        {
            //pagination optional
            RuleFor(x => x.StoreId).NotEmpty().WithMessage("{PropertyName} is required");
            RuleFor(x => x.ItemCategoryId).GreaterThan(0).WithMessage("{PropertyName} is required");
        }
        #endregion
    }
}
