using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class OrganizationSearchFilterValidator : PaginationFilterValidator<OrganizationSearchFilter>
    {
        #region Constructor
        public OrganizationSearchFilterValidator()
        {
            RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
            RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
            RuleFor(x => x.Statuses).Must(x => x == null || x.Any()).WithMessage("{PropertyName} contains empty value(s).");
        }
        #endregion
    }
}
