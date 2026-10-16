using FluentValidation;

namespace Yoma.Core.Domain.Lookups.Validators
{
  /// <summary>
  /// Validates IDs supplied for direct lookup resolution, without search or pagination.
  /// Every supplied ID can be resolved; the selection has no application-level count limit.
  /// </summary>
  public class LookupIdsValidator : AbstractValidator<List<Guid>>
  {
    #region Constructor
    public LookupIdsValidator()
    {
      RuleFor(ids => ids)
        .NotEmpty()
        .WithMessage("Specify at least one lookup ID.");

      RuleForEach(ids => ids)
        .NotEmpty()
        .WithMessage("A lookup ID must not be empty.");
    }
    #endregion
  }
}
