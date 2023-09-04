using FluentValidation;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
    public class MyOpportunityRequestValidatorVerify : AbstractValidator<MyOpportunityRequestVerify>
    {
        #region Constructor
        public MyOpportunityRequestValidatorVerify()
        {
            RuleFor(x => x.Certificate).Must(file => file != null && file.Length > 0).WithMessage("{PropertyName} is required.");
            RuleFor(x => x.DateStart).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(model => model.DateEnd)
                .GreaterThanOrEqualTo(model => model.DateStart)
                .When(model => model.DateEnd.HasValue)
                .WithMessage("{PropertyName} is earlier than the Start Date.");
        }
        #endregion
    }
}
