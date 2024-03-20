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
            RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
            RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate).When(x => x.EndDate.HasValue && x.StartDate.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
            RuleFor(x => x.Opportunities).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.CommitmentIntervalsParsed)
                .Must((x, commitmentIntervals) => commitmentIntervals == null || commitmentIntervals.Count == 0 || commitmentIntervals.All(item => item.Id != Guid.Empty && item.Count >= 1))
                .WithMessage("{PropertyName} is empty, contains an empty interval or count is smaller than 1.");
            RuleFor(x => x.ZltoRewardRangesParsed)
                .Must(zltoRewardRanges => zltoRewardRanges == null || zltoRewardRanges.Count != 0 || zltoRewardRanges.All(item => item.From >= 0 && item.To > item.From))
                .WithMessage("{PropertyName} is empty, contains invalid reward ranges (the 'To' value must be greater than the 'From' value and the 'From' value must be greater or equal to 0.");
            RuleFor(x => x.OrderInstructions)
                .NotNull().WithMessage("{PropertyName} is required")
                .Must(x => x != null && x.Count > 0).WithMessage("{PropertyName} must contain at least one item.");
        }
        #endregion
    }
}
