using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserRequestUpdateLocationValidator : AbstractValidator<UserRequestUpdateLocation>
  {
    public UserRequestUpdateLocationValidator(ICountryService countryService)
    {
      ArgumentNullException.ThrowIfNull(countryService);

      // Profile requests validate their own country field; the dedicated endpoint also runs this rule set.
      RuleSet("Country", () =>
      {
        RuleFor(x => x.CountryId).NotEmpty().WithMessage("'Country' is required.")
          .DependentRules(() =>
          {
            RuleFor(x => x.CountryId).Must(id =>
            {
              var country = countryService.GetByIdOrNull(id);
              return country != null && country.Id != countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
            }).WithMessage("Specified 'Country' is invalid / does not exist. 'Worldwide' is not allowed as a country selection.");
          });
      });

      RuleFor(x => x.Region).MaximumLength(Constants.Region_MaxLength);
      RuleFor(x => x.City).MaximumLength(Constants.City_MaxLength);
      RuleFor(x => x.LocationSource).IsInEnum().When(x => x.LocationSource.HasValue);

      RuleFor(x => x).Must(x => !string.IsNullOrWhiteSpace(x.Region) || !string.IsNullOrWhiteSpace(x.City) ||
        x.Coordinates == null && x.LocationSource == null)
        .WithMessage("Location metadata requires a region or city.");

      When(x => x.Coordinates != null, () =>
      {
        RuleFor(x => x.City).NotEmpty().WithMessage("City is required when coordinates are specified.");
        RuleFor(x => x.LocationSource).NotEqual(LocationSource.Manual)
          .WithMessage("Manual locations cannot include city-centre coordinates.");
        RuleFor(x => x.Coordinates!).SetValidator(new CoordinatesValidator());
      });
    }
  }
}
