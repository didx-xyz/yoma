using FluentValidation;
using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Validators
{
  public class LinkRequestCreateValidator : AbstractValidator<LinkRequestCreate>
  {
    #region Public Members
    public LinkRequestCreateValidator()
    {
      RuleFor(x => x.Name).Length(1, 255).When(x => !string.IsNullOrEmpty(x.Name)).WithMessage("'{PropertyName}' must be between 1 and 255 characters long.");
      RuleFor(x => x.Description).Length(1, 500).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("'{PropertyName}' must be between 1 and 500 characters.");
      RuleFor(x => x.EntityId).Must(x => x != Guid.Empty).WithMessage("'{PropertyName}' is required.");

      // linkService: When LockToDistributionList is enabled, the usage limit is set to the number of items in the DistributionList

      RuleFor(x => x.UsagesLimit)
        .Must(x => !x.HasValue || x > 0)
        .When(x => x.UsagesLimit.HasValue)
        .WithMessage("'Usages Limit' must be greater than 0.");

      RuleFor(x => x.DistributionList)
        .NotEmpty()
        .When(x => x.LockToDistributionList == true)
        .WithMessage("'Distribution List' is required when locking to a distribution list.");

      RuleFor(x => x.DistributionList)
        .NotEmpty().When(x => x.DistributionList != null)
        .WithMessage("'Distribution List' cannot be empty.")
        .DependentRules(() =>
        {
          RuleForEach(x => x.DistributionList)
        .NotEmpty()
        .EmailAddress()
        .WithMessage("'Distribution List' contain(s) empty or invalid email address(es).");
        });

      RuleFor(x => x.DateEnd).Must(date => !date.HasValue || date.Value > DateTimeOffset.UtcNow).WithMessage("'{PropertyName}' must be in the future.");

      //linkService ensure neither usage limit or end date has been specified for link action 'Share'
      //linkService ensure that LockToDistributionList is not enabled for link action 'Share'
      //linkService ensure either a usage limit or an end date has been specified for link action 'Verify'
    }
    #endregion
  }
}
