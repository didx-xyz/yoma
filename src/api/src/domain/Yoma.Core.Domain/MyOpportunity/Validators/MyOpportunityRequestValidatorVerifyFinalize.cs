using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
    public class MyOpportunityRequestValidatorVerifyFinalize : AbstractValidator<MyOpportunityRequestVerifyFinalize>
    {
        #region Class Variables
        private readonly IUserService _userService;

        private readonly static VerificationStatus[] Statuses_Finalize = { VerificationStatus.Completed, VerificationStatus.Rejected };
        #endregion

        #region Constructor
        public MyOpportunityRequestValidatorVerifyFinalize(IUserService userService)
        {
            _userService = userService;

            RuleFor(x => x.UserId).NotEmpty().Must(UserExist).WithMessage($"Specified user does not exist.");
            RuleFor(x => x.Status).Must(x => Statuses_Finalize.Contains(x)).WithMessage($"{{PropertyName}} must be '{string.Join(" / ", Statuses_Finalize)}'.");
            RuleFor(x => x.Comment).NotEmpty().When(x => x.Status == VerificationStatus.Rejected).WithMessage($"{{PropertyName}} required when '{VerificationStatus.Rejected}'.");
        }
        #endregion

        #region Private Members
        private bool UserExist(Guid userId)
        {
            return _userService.GetByIdOrNull(userId, false) != null;
        }
        #endregion
    }
}
