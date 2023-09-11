using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class UserSearchFilterValidator : PaginationFilterValidator<UserSearchFilter>
    {
        #region Constructor
        public UserSearchFilterValidator()
        {
            RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
            RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
        }
        #endregion
    }
}
