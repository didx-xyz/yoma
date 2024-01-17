using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Validators
{
    public class StoreSearchFilterValidator : PaginationFilterValidator<StoreSearchFilter>
    {
        #region Class Variables
        private readonly ICountryService _countryService;
        #endregion

        #region Constructor
        public StoreSearchFilterValidator(ICountryService countryService)
        {
            _countryService = countryService;

            RuleFor(x => x.CountryCodeAlpha2).Must(code => !string.IsNullOrEmpty(code) && CountryExist(code)).WithMessage("{PropertyName} is required and must exist.");
            //categoryId optional
            //pagination optional
        }
        #endregion

        #region Private Members
        private bool CountryExist(string countryCodeAplha2)
        {
            return _countryService.GetByCodeAplha2OrNull(countryCodeAplha2) != null;
        }
        #endregion
    }
}
