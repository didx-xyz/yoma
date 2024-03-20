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
            RuleFor(x => x.PaginationEnabled).Equal(true).When(o => !o.InternalUse).WithMessage("Pagination is required.");
            RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
            RuleFor(x => x.Statuses).Must(x => x == null || x.Count != 0).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.Organizations).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
        }
        #endregion
    }
}
