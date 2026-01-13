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
      RuleFor(x => x.Countries).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
      RuleFor(x => x.DateStart).GreaterThanOrEqualTo(x => x.DateEnd).When(x => x.DateEnd.HasValue && x.DateStart.HasValue).WithMessage("End Date is earlier than the Start Date.");
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => !x.TotalCountOnly).WithMessage("Pagination required.");
    }
    #endregion
  }
}
