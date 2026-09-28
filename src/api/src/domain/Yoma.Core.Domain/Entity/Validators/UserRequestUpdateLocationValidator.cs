using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
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

      RuleFor(x => x.Region).MaximumLength(255);
      RuleFor(x => x.City).MaximumLength(255);
      RuleFor(x => x.LocationSource).IsInEnum().When(x => x.LocationSource.HasValue);

      RuleFor(x => x).Must(x => !string.IsNullOrWhiteSpace(x.Region) || !string.IsNullOrWhiteSpace(x.City) ||
        x.Coordinates == null && x.LocationSource == null)
        .WithMessage("Location metadata requires a region or city.");

      When(x => x.Coordinates != null, () =>
      {
        RuleFor(x => x.City).NotEmpty().WithMessage("City is required when coordinates are specified.");
        RuleFor(x => x.LocationSource).NotEqual(LocationSource.Manual)
          .WithMessage("Manual locations cannot include city-centre coordinates.");
        RuleFor(x => x.Coordinates).Cascade(CascadeMode.Stop)
          .Must(values => values!.Length == 2)
          .WithMessage("Coordinates must contain exactly two values: longitude, latitude.")
          .Must(values => double.IsFinite(values![0]) && values[0] >= -180 && values[0] <= 180)
          .WithMessage("Longitude must be a finite value between -180 and 180.")
          .Must(values => double.IsFinite(values![1]) && values[1] >= -90 && values[1] <= 90)
          .WithMessage("Latitude must be a finite value between -90 and 90.");
      });
    }
  }
}
