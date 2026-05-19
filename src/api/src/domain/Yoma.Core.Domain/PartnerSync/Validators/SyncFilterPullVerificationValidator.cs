using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Validators
{
  public sealed class SyncFilterPullVerificationValidator : PaginationFilterValidator<SyncFilterPullVerification>
  {
    #region Constrcutor
    public SyncFilterPullVerificationValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");

      RuleFor(model => model.DateStart)
           .LessThanOrEqualTo(_ => DateTimeOffset.UtcNow)
           .WithMessage("Start date cannot be in the future.");

      RuleFor(model => model)
        .Must(model => !model.DateEnd.HasValue || model.DateEnd.Value >= model.DateStart)
        .WithMessage("End date cannot be earlier than the start date.");
    }
    #endregion
  }
}
