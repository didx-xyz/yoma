using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunitySearchFilterValidator : PaginationFilterValidator<OpportunitySearchFilterAdmin>
  {
    #region Constructor
    public OpportunitySearchFilterValidator(OpportunitySearchSelectionValidator selectionValidator)
    {
      ArgumentNullException.ThrowIfNull(selectionValidator);

      RuleFor(x => x)
        .SetValidator(selectionValidator);

      RuleFor(x => x.AdditionalMembers)
        .Must(x => x == null || x.Count == 0)
        .WithMessage("Unknown search members are not supported; use groups for OR selections.");

      RuleFor(x => x.PaginationEnabled)
        .Equal(true)
        .When(x => !x.TotalCountOnly && !x.UnrestrictedQuery)
        .WithMessage("Pagination required");

      RuleFor(x => x.ValueContains)
        .Length(3, 50)
        .When(x => !string.IsNullOrEmpty(x.ValueContains));

      RuleFor(x => x.EndDate)
        .GreaterThanOrEqualTo(x => x.StartDate)
        .When(x => x.EndDate.HasValue && x.StartDate.HasValue);

      RuleForEach(x => x.Statuses)
        .IsInEnum();

      RuleForEach(x => x.PublishedStates)
        .IsInEnum();

      RuleFor(x => x.Ordering)
        .Must(x => x == null || x.Count is > 0 and <= OpportunitySearchConstants.Ordering_MaxCount &&
          x.All(o => o != null) && x.Select(o => o.Field).Distinct().Count() == x.Count)
        .WithMessage("Ordering requires one to three unique supported fields.");
      RuleForEach(x => x.Ordering)
        .ChildRules(order =>
      {
        order.RuleFor(x => x.Field)
          .IsInEnum();

        order.RuleFor(x => x.Direction)
          .IsInEnum();
      });

      RuleFor(x => x.Groups)
        .Must(x => x == null || x.Count is > 0 and <= OpportunitySearchConstants.Groups_MaxCount && x.All(o => o != null))
        .WithMessage("Supply one to four non-empty groups.");
      RuleForEach(x => x.Groups)
        .ChildRules(group =>
      {
        group.RuleFor(x => x.AnyOf)
          .Must(x => x != null && x.Count is > 0 and <= OpportunitySearchConstants.Branches_MaxCount && x.All(o => o != null))
          .WithMessage("Each group requires one to eight non-empty branches.");
        group.RuleForEach(x => x.AnyOf)
          .SetValidator(selectionValidator);

        group.RuleForEach(x => x.AnyOf)
          .ChildRules(branch =>
        {
          branch.RuleFor(x => x.AdditionalMembers)
            .Must(x => x == null || x.Count == 0)
            .WithMessage("Root-only controls, unknown fields and nested groups are not allowed in branches.");
          branch.RuleFor(x => x)
            .Must(x => ActiveCriteriaCount(x) is > 0 and <= OpportunitySearchConstants.Criteria_MaxCount)
            .WithMessage("Each branch requires one to twenty-four active criteria.");
        });
      });
    }
    #endregion

    #region Private Members
    private static int ActiveCriteriaCount(OpportunitySearchSelection selection)
    {
      // Count only selection members, never pagination/ordering controls inherited by the root.
      return typeof(OpportunitySearchSelection).GetProperties()
        .Count(o => o.GetValue(selection) != null &&
          (o.Name != nameof(selection.ZltoReward) || selection.ZltoReward?.Value?.HasReward != false ||
            selection.ZltoReward.Value.Ranges?.Count > 0 || selection.ZltoReward.Unspecified.HasValue));
    }
    #endregion
  }
}
