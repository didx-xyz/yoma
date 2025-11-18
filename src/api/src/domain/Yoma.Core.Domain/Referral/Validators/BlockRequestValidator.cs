using FluentValidation;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public class BlockRequestValidator : AbstractValidator<BlockRequest>
  {
    #region Constructor
    public BlockRequestValidator(IBlockReasonService blockReasonService)
    {
      _ = blockReasonService ?? throw new ArgumentNullException(nameof(blockReasonService));

      RuleFor(x => x.UserId)
        .NotEmpty()
        .WithMessage("User Id is required.");

      RuleFor(x => x.ReasonId)
        .Cascade(CascadeMode.Stop)
        .NotEmpty()
        .WithMessage("Reason Id is required.")
        .Must(id => blockReasonService.GetByIdOrNull(id) != null)
        .WithMessage("Invalid block reason specified.");

      RuleFor(x => x.Comment)
        .Cascade(CascadeMode.Stop)
        .MaximumLength(400)
        .WithMessage("Comment cannot exceed 400 characters.")
        .Must((request, comment) =>
        {
          var reason = blockReasonService.GetById(request.ReasonId);
          var isOther = string.Equals(reason.Name, ReferralBlockReason.Other.ToString(), StringComparison.OrdinalIgnoreCase);
          return !isOther || !string.IsNullOrEmpty(comment);
        })
        .WithMessage($"Comment is required when the block reason is '{ReferralBlockReason.Other}'.");
    }
    #endregion
  }
}
