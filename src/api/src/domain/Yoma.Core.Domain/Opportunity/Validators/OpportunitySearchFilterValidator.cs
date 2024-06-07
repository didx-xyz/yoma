using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunitySearchFilterValidator : PaginationFilterValidator<OpportunitySearchFilterAdmin>
  {
    #region Constructor
    public OpportunitySearchFilterValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => !x.TotalCountOnly).WithMessage("Pagination required");
      RuleFor(x => x.Types).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Categories).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Languages).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Countries).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Organizations).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.EngagementTypes).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
      RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate).When(x => x.EndDate.HasValue && x.StartDate.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
      RuleFor(x => x.Opportunities).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");

      // CommitmentInterval
      // Options and Interval are optional but mutually exclusive
      RuleFor(x => x.CommitmentInterval)
          .Must(ci => ci?.Options == null || ci.Options.Count == 0 || ci?.Interval == null)
          .WithMessage("{PropertyName}: Both Options and Interval cannot be specified at the same time.");

      RuleFor(x => x.CommitmentInterval)
          .Must(ci => ci?.OptionsParsed == null ||
                      ci.OptionsParsed.Count == 0 ||
                      ci.OptionsParsed.All(item => item.Id != Guid.Empty && item.Count >= 1))
          .WithMessage("{PropertyName} is empty, contains an empty interval or count is smaller than 1.");

      RuleFor(x => x.CommitmentInterval)
          .Must(ci => ci?.Interval == null || (ci.Interval.Id != Guid.Empty && ci.Interval.Count >= 1))
          .WithMessage("{PropertyName}: Interval is empty, contains an empty interval or count is smaller than 1.");

      // ZltoReward:
      // Ranges and HasReward are optional but mutually exclusive
      RuleFor(x => x.ZltoReward)
          .Must(zr => zr?.Ranges == null || zr.Ranges.Count == 0 || zr?.HasReward == false)
          .WithMessage("{PropertyName}: Both Ranges and HasReward cannot be specified at the same time.");

      RuleFor(x => x.ZltoReward)
           .Must(zr => zr?.RangesParsed == null ||
                       zr.RangesParsed.Count == 0 ||
                       zr.RangesParsed.All(item => item.From >= 0 && item.To > item.From))
           .WithMessage("{PropertyName} is empty, contains invalid reward ranges (the 'To' value must be greater than the 'From' value and the 'From' value must be greater or equal to 0.");
    
      RuleFor(x => x.OrderInstructions)
          .NotNull().WithMessage("{PropertyName} is required")
          .Must(x => x != null && x.Count > 0).WithMessage("{PropertyName} must contain at least one item.");
    }
    #endregion
  }
}
