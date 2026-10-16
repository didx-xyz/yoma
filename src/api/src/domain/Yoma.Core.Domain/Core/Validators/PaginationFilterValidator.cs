using FluentValidation;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Validators
{
  public class PaginationFilterValidator<TFilter> : AbstractValidator<TFilter>
        where TFilter : IPaginationFilter
  {
    #region Constructor
    public PaginationFilterValidator()
    {
      RuleFor(x => x.PageNumber)
        .NotNull()
        .GreaterThanOrEqualTo(1)
        .When(x => x.PageNumber.HasValue || x.PaginationEnabled)
        .WithMessage("{PropertyName} must be greater than 0.");

      RuleFor(x => x.PageSize)
        .NotNull()
        .GreaterThanOrEqualTo(1)
        .LessThanOrEqualTo(1000)
        .When(x => x.PageSize.HasValue || x.PaginationEnabled)
        .WithMessage("{PropertyName} must be between 1 and 1000.");

      // LINQ Skip takes an Int32; reject an overflowing offset before query execution.
      RuleFor(x => x.PageNumber)
        .Must((filter, page) => ((long)page!.Value - 1) * filter.PageSize!.Value <= int.MaxValue)
        .When(x => x.PageNumber > 0 && x.PageSize > 0)
        .WithMessage("The requested page exceeds the supported pagination offset.");
    }
    #endregion
  }
}
