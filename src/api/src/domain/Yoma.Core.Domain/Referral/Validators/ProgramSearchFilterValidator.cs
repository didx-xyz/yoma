using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public class ProgramSearchFilterValidator : PaginationFilterValidator<ProgramSearchFilterAdmin>
  {
    #region Constructor
    public ProgramSearchFilterValidator()
    {
      RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
      RuleFor(x => x.DateStart).GreaterThanOrEqualTo(x => x.DateEnd).When(x => x.DateEnd.HasValue && x.DateStart.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
    }
    #endregion
  }
}
