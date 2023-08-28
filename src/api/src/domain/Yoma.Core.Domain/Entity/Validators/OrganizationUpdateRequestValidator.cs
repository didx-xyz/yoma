using FluentValidation;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class OrganizationUpdateRequestValidator : OrganizationRequestValidatorBase<OrganizationUpdateRequest>
    {
        #region Class Variables
        #endregion

        #region Constructor
        public OrganizationUpdateRequestValidator(ICountryService countryService) : base(countryService)
        {
            RuleFor(x => x.Id).NotEmpty();
        }
        #endregion
    }
}
