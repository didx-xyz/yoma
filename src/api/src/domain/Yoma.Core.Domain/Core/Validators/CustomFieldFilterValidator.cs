using FluentValidation;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Validators
{
  public sealed class CustomFieldFilterValidator : AbstractValidator<CustomFieldFilter>
  {
    #region Constructor
    public CustomFieldFilterValidator()
    {
      RuleFor(o => o.Key)
        .NotEmpty()
        .Must(o => !string.IsNullOrWhiteSpace(o))
        .WithMessage("{PropertyName} is required.");

      RuleFor(o => o.Operator)
        .IsInEnum();

      RuleFor(o => o.Value)
        .Must(o => o == null || !o.Contains(CustomFieldValue.Value_Delimiter))
        .WithMessage("{PropertyName} contains an invalid delimiter.");

      RuleFor(o => o.Values)
        .Must(values => values == null ||
          values.All(o =>
            !string.IsNullOrWhiteSpace(o) &&
            !o.Contains(CustomFieldValue.Value_Delimiter)))
        .WithMessage("{PropertyName} contains empty or invalid values.");

      RuleFor(o => o.Values)
        .Must(values => values == null ||
          values.Distinct(StringComparer.OrdinalIgnoreCase).Count() == values.Count)
        .WithMessage("{PropertyName} contains duplicate values.");

      RuleFor(o => o)
        .Must(HasValidValueShape)
        .WithMessage("Custom field filter value does not match the selected operator.");
    }
    #endregion

    #region Private Members
    private static bool HasValidValueShape(CustomFieldFilter filter)
    {
      var hasValue = !string.IsNullOrWhiteSpace(filter.Value);
      var hasValues = filter.Values?.Count > 0;

      return filter.Operator switch
      {
        CustomFieldFilterOperator.Exists =>
          !hasValue && !hasValues,

        CustomFieldFilterOperator.Equals or
        CustomFieldFilterOperator.Contains =>
          hasValue && !hasValues,

        CustomFieldFilterOperator.AnyOf or
        CustomFieldFilterOperator.AllOf =>
          !hasValue && hasValues,

        _ => false
      };
    }
    #endregion
  }
}
