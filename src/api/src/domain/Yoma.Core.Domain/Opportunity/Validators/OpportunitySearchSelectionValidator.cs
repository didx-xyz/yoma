using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunitySearchSelectionValidator : AbstractValidator<OpportunitySearchSelection>
  {
    #region Constructor
    public OpportunitySearchSelectionValidator(
      CoordinatesValidator coordinatesValidator,
      ICountryService countryService,
      IAccessibilityService accessibilityService,
      CustomFieldFilterValidator customFieldFilterValidator)
    {
      ArgumentNullException.ThrowIfNull(coordinatesValidator);
      ArgumentNullException.ThrowIfNull(countryService);
      ArgumentNullException.ThrowIfNull(accessibilityService);
      ArgumentNullException.ThrowIfNull(customFieldFilterValidator);

      RuleFor(x => x.Provider)
        .Must(x => SearchCriterionHelper.IsValid(x, !string.IsNullOrEmpty(x?.Value)))
        .WithMessage("Provider requires a value, or Only without a value.");
      RuleFor(x => x.Provider!.Value)
        .MaximumLength(Services.OpportunityService.Provider_MaxLength)
        .When(x => x.Provider != null);

      RuleFor(x => x.Incentivized)
        .Must(x => SearchCriterionHelper.IsValid(x, x?.Value.HasValue == true))
        .WithMessage("Incentivized requires a boolean value, or Only without a value.");

      RuleFor(x => x.RewardTypes)
        .Must(x => SearchCriterionHelper.IsValid(x, x?.Value?.Count > 0, false))
        .WithMessage("Reward types require a selection and do not support unspecified modes.");
      RuleForEach(x => x.RewardTypes!.Value)
        .IsInEnum()
        .When(x => x.RewardTypes != null);

      RuleFor(x => x.AccessibilitySupport)
        .Must(x => SearchCriterionHelper.IsValid(x, x?.Value.HasValue == true))
        .WithMessage("Accessibility support requires a value, or Only without a value.");
      RuleFor(x => x.AccessibilitySupport!.Value)
        .IsInEnum()
        .When(x => x.AccessibilitySupport?.Value.HasValue == true);

      RuleFor(x => x.AccommodationOtherDescription)
        .Must(x => SearchCriterionHelper.IsValid(x, !string.IsNullOrEmpty(x?.Value)))
        .WithMessage("Other description requires text, or Only without text.");
      RuleFor(x => x.AccommodationOtherDescription!.Value)
        .MaximumLength(Services.OpportunityService.AccommodationOtherDescription_MaxLength)
        .When(x => x.AccommodationOtherDescription != null);
      RuleFor(x => x)
        .Must(x => x.AccommodationOtherDescription == null ||
          x.Accommodations?.Value?.Any(id => id != Guid.Empty &&
            accessibilityService.GetByIdOrNull(id)?.Name == AccessibilityOption.Other.ToString()) == true)
        .WithMessage("Select the Other accommodation in the same criteria object when filtering its description.");

      RuleFor(x => x.Accommodations)
        .Must(x => ValidIds(x));

      RuleFor(x => x.TargetedGroups)
        .Must(x => ValidIds(x));

      RuleFor(x => x.SustainableDevelopmentGoals)
        .Must(x => ValidIds(x));

      RuleFor(x => x.Age)
        .GreaterThanOrEqualTo((short)0);

      RuleFor(x => x.Types)
        .Must(x => ValidIds(x, false));

      RuleFor(x => x.Categories)
        .Must(x => ValidIds(x));

      RuleFor(x => x.Languages)
        .Must(x => ValidIds(x));

      RuleFor(x => x.Countries)
        .Must(x => x == null || x.All(o => o != null) &&
          x.Select(o => o.CountryId).Distinct().Count() == x.Count)
        .WithMessage("Countries must contain one non-empty entry per country.");

      RuleForEach(x => x.Countries)
        .ChildRules(country =>
      {
        country.RuleFor(x => x.CountryId)
          .NotEmpty();

        country.RuleFor(x => x.Region)
          .Must(x => SearchCriterionHelper.IsValid(x, !string.IsNullOrEmpty(x?.Value)));
        country.RuleFor(x => x.Region!.Value)
          .MaximumLength(Constants.Region_MaxLength)
          .When(x => x.Region != null);

        country.RuleFor(x => x.City)
          .Must(x => SearchCriterionHelper.IsValid(x, !string.IsNullOrEmpty(x?.Value)));
        country.RuleFor(x => x.City!.Value)
          .MaximumLength(Constants.City_MaxLength)
          .When(x => x.City != null);

        country.RuleFor(x => x.Radius)
          .Must(x => SearchCriterionHelper.IsValid(x, x?.Value != null));
        country.RuleFor(x => x)
          .Must(x => x.Radius == null || x.Region == null && x.City == null)
          .WithMessage("Specify either region/city or coordinates and radius, not both.");
        country.RuleFor(x => x.Radius!.Value!.Coordinates)
          .NotNull()
          .SetValidator(coordinatesValidator)
          .When(x => x.Radius?.Value != null);
        country.RuleFor(x => x.Radius!.Value!.RadiusKm)
          .Must(x => double.IsFinite(x * 1000) && x > 0)
          .When(x => x.Radius?.Value != null)
          .WithMessage("Radius must be a finite positive number of kilometres.");

        country.RuleFor(x => x)
          .Must(x => countryService.GetByIdOrNull(x.CountryId)?.CodeAlpha2 != Country.Worldwide.ToDescription() ||
            x.Region == null && x.City == null && x.Radius == null)
          .WithMessage("Worldwide cannot include region, city or radius criteria.");
      });

      RuleFor(x => x.Organizations)
        .Must(x => ValidIds(x, false));

      RuleFor(x => x.EngagementTypes)
        .Must(x => ValidIds(x));

      RuleFor(x => x.Skills)
        .Must(x => ValidIds(x));

      RuleFor(x => x.CommitmentInterval)
        .Must(x => SearchCriterionHelper.IsValid(x, x?.Value?.Interval != null || x?.Value?.Options?.Count > 0))
        .WithMessage("Commitment requires options or a maximum interval, or Only without a value.");
      RuleFor(x => x.CommitmentInterval)
        .Must(x => x?.Value?.Options?.Count is not > 0 || x.Value.Interval == null)
        .WithMessage("Commitment options and maximum interval are mutually exclusive.");
      RuleFor(x => x.CommitmentInterval)
        .Must(x => x?.Value?.Interval == null || x.Value.Interval.Id != Guid.Empty && x.Value.Interval.Count > 0)
        .WithMessage("Maximum commitment requires a valid interval and positive count.");
      RuleFor(x => x.CommitmentInterval)
        .Must(x => x?.Value?.OptionsParsed == null ||
          x.Value.OptionsParsed.All(o => o.Id != Guid.Empty && o.Count > 0))
        .WithMessage("Commitment options contain an invalid interval or count.");

      RuleFor(x => x.ZltoReward)
        .Must(x => x?.Value?.HasReward == false && x.Value.Ranges?.Count is not > 0 && !x.Unspecified.HasValue ||
          SearchCriterionHelper.IsValid(x, x?.Value?.HasReward == true || x?.Value?.Ranges?.Count > 0))
        .WithMessage("ZLTO reward requires ranges, positive reward selection, or Only without a value.");
      RuleFor(x => x.ZltoReward)
        .Must(x => x?.Value?.Ranges?.Count is not > 0 || x.Value.HasReward != true)
        .WithMessage("ZLTO ranges and positive reward selection are mutually exclusive.");
      RuleFor(x => x.ZltoReward)
        .Must(x => x?.Value?.RangesParsed == null || x.Value.RangesParsed.All(o => o.From >= 0 && o.To > o.From))
        .WithMessage("ZLTO reward ranges require non-negative lower and greater upper bounds.");

      RuleFor(x => x.CustomFields)
        .Must(x => x == null || x.All(o => o != null) &&
          x.Select(o => o.Key).Distinct(StringComparer.OrdinalIgnoreCase).Count() == x.Count)
        .WithMessage("Custom fields contain empty entries or duplicate keys.");
      RuleForEach(x => x.CustomFields)
        .SetValidator(customFieldFilterValidator);
    }
    #endregion

    #region Private Members
    private static bool ValidIds(SearchCriterion<List<Guid>>? criterion, bool supportsUnspecified = true)
    {
      return SearchCriterionHelper.IsValid(criterion, criterion?.Value?.Count > 0, supportsUnspecified) &&
        (criterion?.Value == null || criterion.Value.All(o => o != Guid.Empty));
    }
    #endregion
  }
}
