using FluentValidation;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Domain.ActionLink.Validators
{
  public class LinkRequestCreateValidatorVerify : LinkRequestCreateValidatorBase<LinkRequestCreateVerify>
  {
    #region Public Members
    public LinkRequestCreateValidatorVerify()
    {
      // linkService: When LockToDistributionList is enabled, the usage limit is set to the number of items in the DistributionList
      // linkService: Ensure either a usage limit or an end date is specified

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
          .Must(item =>
              new EmailAddressAttribute().IsValid(item) ||
              PhoneNumberValidator.IsValidPhoneNumber(item))
          .WithMessage("'Distribution List' contains one or more empty or invalid email addresses or international phone numbers (e.g. +27831234567).");
        });

      RuleFor(x => x.DateEnd).Must(date => !date.HasValue || date.Value.ToEndOfDay() > DateTimeOffset.UtcNow).WithMessage("'{PropertyName}' must be in the future.");
    }
    #endregion
  }
}
