using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunityRequestCountryValidator : AbstractValidator<OpportunityRequestCountry>
  {
    public OpportunityRequestCountryValidator(ICountryService countryService,
        CoordinatesValidator coordinatesValidator)
    {
      ArgumentNullException.ThrowIfNull(countryService);
      ArgumentNullException.ThrowIfNull(coordinatesValidator);

      RuleFor(x => x.CountryId)
          .NotEmpty()
          .Must(id => countryService.GetByIdOrNull(id) != null)
          .WithMessage("Specified country is invalid or does not exist.");

      RuleFor(x => x.Region)
          .MaximumLength(Constants.Region_MaxLength);

      RuleFor(x => x.City)
          .MaximumLength(Constants.City_MaxLength);

      RuleFor(x => x.Coordinates!)
          .SetValidator(coordinatesValidator)
          .When(x => x.Coordinates != null);

      RuleFor(x => x)
          .Must(x => countryService.GetByIdOrNull(x.CountryId)?.CodeAlpha2 != Country.Worldwide.ToDescription() ||
        x.Region == null && x.City == null && x.Coordinates == null)
          .WithMessage("Worldwide cannot include region, city or coordinates.");
    }
  }
}
