using FluentValidation;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class OrganizationRequestUpdateRewardPoolValidator : AbstractValidator<OrganizationRequestUpdateRewardPool>
  {
    #region Constructor
    public OrganizationRequestUpdateRewardPoolValidator()
    {
      RuleFor(x => x.ZltoRewardPoolCurrentFinancialYear)
        .ZltoRewardPool();
    }
    #endregion
  }
}
