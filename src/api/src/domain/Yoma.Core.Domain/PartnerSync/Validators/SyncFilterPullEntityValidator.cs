using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Validators
{
  public sealed class SyncFilterPullEntityValidator : PaginationFilterValidator<SyncFilterPullEntity>
  {
    #region Constrcutor
    public SyncFilterPullEntityValidator()
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
    }
    #endregion
  }
}
