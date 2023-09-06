using FluentValidation;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class OrganizationRequestUpdateStatusValidator : AbstractValidator<OrganizationRequestUpdateStatus>
    {
        #region Constructor
        public OrganizationRequestUpdateStatusValidator()
        {
            RuleFor(x => x.Comment).NotEmpty().When(x => x.Status == OrganizationStatus.Declined).WithMessage($"{{PropertyName}} required when '{OrganizationStatus.Declined}'.");
        }
        #endregion
    }
}
