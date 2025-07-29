using FluentValidation;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
  public class MyOpportunityRequestValidatorVerifyFinalizeBatch : AbstractValidator<MyOpportunityRequestVerifyFinalizeBatch>
  {
    #region Class Variables
    private readonly IUserService _userService;
    private readonly IOpportunityService _opportunityService;
    #endregion

    #region Constructor
    public MyOpportunityRequestValidatorVerifyFinalizeBatch(IUserService userService, IOpportunityService opportunityService)
    {
      _userService = userService;
      _opportunityService = opportunityService;

      RuleFor(x => x.Status).Must(x => Services.MyOpportunityService.Statuses_Finalize.Contains(x)).WithMessage($"{{PropertyName}} must be '{Services.MyOpportunityService.Statuses_Finalize.JoinNames()}'.");
      RuleFor(x => x.Comment)
          .MaximumLength(400)
          .WithMessage("{PropertyName} can not exceed 400 characters.")
          .NotEmpty()
          .When(x => x.Status == VerificationStatus.Rejected)
          .WithMessage("{PropertyName} is required when '{VerificationStatus.Rejected}'.");

      RuleFor(x => x.Items).Must(items => items != null && items.Count != 0).WithMessage("Items cannot be null or empty.");

      RuleForEach(x => x.Items).ChildRules(item =>
      {
        item.RuleFor(i => i.OpportunityId)
            .NotEmpty()
            .Must(OpportunityExists)
            .WithMessage("Specified opportunity does not exist.");

        item.RuleFor(i => i.UserId)
            .NotEmpty()
            .Must(UserExists)
            .WithMessage("Specified user does not exist.");
      });
    }
    #endregion

    #region Private Members
    private bool UserExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _userService.GetByIdOrNull(id, false, false) != null;
    }

    private bool OpportunityExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _opportunityService.GetByIdOrNull(id, false, false, false) != null;
    }
    #endregion
  }
}
