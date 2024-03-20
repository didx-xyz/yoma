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

      RuleFor(x => x.CountryCodeAlpha2).Must(code => !string.IsNullOrEmpty(code) && CountryExists(code)).WithMessage("{PropertyName} is required and must exist.");
      //categoryId optional
      //pagination optional
    }
    #endregion

    #region Private Members
    private bool CountryExists(string codeAplha2)
    {
      if (string.IsNullOrEmpty(codeAplha2)) return false;
      return _countryService.GetByCodeAplha2OrNull(codeAplha2) != null;
    }
    #endregion
  }
}
