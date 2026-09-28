using FluentValidation;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserPreferencesRequestValidator : AbstractValidator<UserPreferencesRequest>
  {
    public UserPreferencesRequestValidator(ISkillService skillService, IOpportunityCategoryService opportunityCategoryService,
      IUserGoalService userGoalService, ITimeIntervalService timeIntervalService,
      IAccessibilityService accessibilityService,
      IEngagementTypeService engagementTypeService, ILanguageService languageService)
    {
      ArgumentNullException.ThrowIfNull(skillService);
      ArgumentNullException.ThrowIfNull(opportunityCategoryService);
      ArgumentNullException.ThrowIfNull(userGoalService);
      ArgumentNullException.ThrowIfNull(timeIntervalService);
      ArgumentNullException.ThrowIfNull(accessibilityService);
      ArgumentNullException.ThrowIfNull(engagementTypeService);
      ArgumentNullException.ThrowIfNull(languageService);

      RuleFor(x => x.GoalId)
        .Must(id => !id.HasValue || id.Value != Guid.Empty && userGoalService.GetByIdOrNull(id.Value) != null)
        .WithMessage("User Goal is optional, but must exist if specified.");

      RuleFor(x => x.CommitmentIntervalId)
        .Cascade(CascadeMode.Stop)
        .Must((request, id) => id.HasValue == request.CommitmentIntervalCount.HasValue)
        .WithMessage("Commitment interval and count must both be supplied or both be empty.")
        .Must(id => !id.HasValue || id.Value != Guid.Empty && timeIntervalService.GetByIdOrNull(id.Value) != null)
        .WithMessage("Specified commitment interval is invalid or does not exist.");

      RuleFor(x => x.CommitmentIntervalCount)
        .Must(count => !count.HasValue || count > 0)
        .WithMessage("Commitment interval count must be greater than 0.");

      RuleFor(x => x.EngagementTypeId)
        .Must(id => !id.HasValue || id.Value != Guid.Empty && engagementTypeService.GetByIdOrNull(id.Value) != null)
        .WithMessage("Engagement type is optional, but must exist if specified.");

      RuleFor(x => x.Categories)
        .Must(categories => categories == null || categories.All(id => id != Guid.Empty && opportunityCategoryService.GetByIdOrNull(id) != null))
        .WithMessage("Preferred Opportunity Categories are optional, but must exist if specified.");

      RuleFor(x => x.AccessibilityRequirements)
        .Must(needs => needs == null || needs.All(id => id != Guid.Empty && accessibilityService.GetByIdOrNull(id) != null))
        .WithMessage("Accessibility requirements are optional, but must exist if specified.");

      RuleFor(x => x.AccessibilityRequirementOtherDescription)
        .Must((request, description) =>
        {
          var otherSelected = request.AccessibilityRequirements?.Any(id =>
            id != Guid.Empty && accessibilityService.GetByIdOrNull(id)?.Name == "Other") == true;
          return otherSelected ? !string.IsNullOrWhiteSpace(description) && description.Length <= 500
            : string.IsNullOrWhiteSpace(description);
        })
        .WithMessage("Other accessibility requirement description is required (up to 500 characters) only when Other is selected.");

      RuleFor(x => x.Languages)
        .Must(languages => languages == null || languages.All(id => id != Guid.Empty && languageService.GetByIdOrNull(id) != null))
        .WithMessage("Preferred Languages are optional, but must exist if specified.");

      RuleFor(x => x.SkillsSelfAttested)
        .Must(skills => skills == null || skills.All(id => id != Guid.Empty && skillService.GetByIdOrNull(id) != null))
        .WithMessage("Self-attested skills are optional, but must exist if specified.");
    }
  }
}
