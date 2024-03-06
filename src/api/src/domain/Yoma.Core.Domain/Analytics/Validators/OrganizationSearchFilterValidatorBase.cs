using FluentValidation;
using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.Analytics.Validators
{
    public class OrganizationSearchFilterValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : IOrganizationSearchFilterBase
    {
        #region Class Variables
        private readonly IOrganizationService _organizationService;
        #endregion

        #region Constructor
        public OrganizationSearchFilterValidatorBase(IOrganizationService organizationService)
        {
            _organizationService = organizationService;

            RuleFor(x => x.Organization).NotEmpty().Must(Organizationxists).WithMessage($"Specified organization is invalid / does not exist.");
            RuleFor(x => x)
                .Custom((model, context) =>
                {
                    bool opportunitiesSpecified = model.Opportunities != null && model.Opportunities.Any(id => id != Guid.Empty);
                    bool categoriesSpecified = model.Categories != null && model.Categories.Any(id => id != Guid.Empty);

                    if (opportunitiesSpecified && categoriesSpecified)
                    {
                        context.AddFailure("Either opportunities or categories may be specified, but not both.");
                    }
                });
            RuleFor(x => x.Opportunities).Must(x => x == null || !x.Any() || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.Categories).Must(x => x == null || !x.Any() || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate).When(x => x.EndDate.HasValue && x.StartDate.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
        }
        #endregion

        #region Private Members
        private bool Organizationxists(Guid id)
        {
            return _organizationService.GetByIdOrNull(id, false, false, false) != null;
        }
        #endregion
    }
}
