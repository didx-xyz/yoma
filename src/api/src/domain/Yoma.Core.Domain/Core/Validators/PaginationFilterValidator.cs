using FluentValidation;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Validators
{
    public class PaginationFilterValidator<TFilter> : AbstractValidator<TFilter>
        where TFilter : PaginationFilter
    {
        #region Constructor
        public PaginationFilterValidator()
        {
            RuleFor(x => x.PageNumber).NotNull().GreaterThanOrEqualTo(1).When(x => x.PageNumber.HasValue || x.PaginationEnabled).WithMessage("{PropertyName} must be greater than 0.");
            RuleFor(x => x.PageSize).NotNull().GreaterThanOrEqualTo(1).When(x => x.PageSize.HasValue || x.PaginationEnabled).WithMessage("{PropertyName} must be greater than 0.");
        }
        #endregion
    }
}
