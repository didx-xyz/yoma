using FluentValidation;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Validators
{
  public sealed class SyncFilterPullValidator : AbstractValidator<SyncFilterPull>
  {
    #region Constrcutor
    public SyncFilterPullValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
    }
    #endregion
  }
}
