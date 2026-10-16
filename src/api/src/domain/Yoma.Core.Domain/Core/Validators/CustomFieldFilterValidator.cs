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
        .IsInEnum()
        .When(o => o.Operator.HasValue);

      RuleFor(o => o.Unspecified)
        .IsInEnum()
        .When(o => o.Unspecified.HasValue);

      RuleFor(o => o.Value)
        .Must(o => o == null || !o.Contains(CustomFieldValue.Value_Delimiter))
        .WithMessage("{PropertyName} contains an invalid delimiter.");

      RuleFor(o => o.ValueTo)
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
      var hasValueTo = !string.IsNullOrWhiteSpace(filter.ValueTo);
      var hasValues = filter.Values?.Count > 0;

      if (filter.Unspecified == UnspecifiedMatch.Only)
        return !filter.Operator.HasValue && !hasValue && !hasValueTo && !hasValues;

      // Invalid wire enum values are validation failures, not unsupported runtime branches.
      if (!filter.Operator.HasValue || !Enum.IsDefined(filter.Operator.Value)) return false;
      if (filter.Operator == CustomFieldFilterOperator.Exists &&
        filter.Unspecified is UnspecifiedMatch.Include or UnspecifiedMatch.Only) return false;

      return filter.Operator switch
      {
        CustomFieldFilterOperator.Exists =>
          !hasValue && !hasValueTo && !hasValues,

        CustomFieldFilterOperator.Equals or
        CustomFieldFilterOperator.Contains or
        CustomFieldFilterOperator.GreaterThan or
        CustomFieldFilterOperator.GreaterThanOrEqual or
        CustomFieldFilterOperator.LessThan or
        CustomFieldFilterOperator.LessThanOrEqual =>
          hasValue && !hasValueTo && !hasValues,

        CustomFieldFilterOperator.AnyOf or
        CustomFieldFilterOperator.AllOf =>
          !hasValue && !hasValueTo && hasValues,

        CustomFieldFilterOperator.Between =>
          hasValue && hasValueTo && !hasValues,

        _ => throw new NotSupportedException($"Custom field operator '{filter.Operator}' is not supported")
      };
    }
    #endregion
  }
}
