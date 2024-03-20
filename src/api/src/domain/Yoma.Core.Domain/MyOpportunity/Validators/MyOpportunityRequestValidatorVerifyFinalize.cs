using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
  public class MyOpportunityRequestValidatorVerifyFinalize : AbstractValidator<MyOpportunityRequestVerifyFinalize>
  {
    #region Class Variables
    private readonly IUserService _userService;
    private readonly IOpportunityService _opportunityService;

    private readonly static VerificationStatus[] Statuses_Finalize = [VerificationStatus.Completed, VerificationStatus.Rejected];
    #endregion

    #region Constructor
    public MyOpportunityRequestValidatorVerifyFinalize(IUserService userService, IOpportunityService opportunityService)
    {
      _userService = userService;
      _opportunityService = opportunityService;

      RuleFor(x => x.OpportunityId).NotEmpty().Must(OpportunityExists).WithMessage($"Specified opportunity does not exist.");
      RuleFor(x => x.UserId).NotEmpty().Must(UserExists).WithMessage($"Specified user does not exist.");
      RuleFor(x => x.Status).Must(x => Statuses_Finalize.Contains(x)).WithMessage($"{{PropertyName}} must be '{string.Join(" / ", Statuses_Finalize)}'.");
      RuleFor(x => x.Comment).NotEmpty().When(x => x.Status == VerificationStatus.Rejected).WithMessage($"{{PropertyName}} required when '{VerificationStatus.Rejected}'.");
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
