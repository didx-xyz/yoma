using FluentValidation;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
    public class MyOpportunityRequestValidatorVerify : AbstractValidator<MyOpportunityRequestVerify>
    {
        #region Class Variables
        private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
        #endregion

        #region Constructor
        public MyOpportunityRequestValidatorVerify(IOpportunityVerificationTypeService opportunityVerificationTypeService)
        {
            _opportunityVerificationTypeService = opportunityVerificationTypeService;

            RuleFor(x => x.Items).NotNull().NotEmpty().WithMessage("One or more verification items are required");
            RuleForEach(x => x.Items)
                .Must(item => VerificationTypeExist(item.VerificationTypeId))
                .WithMessage("Verification type is required and must exist");
            RuleForEach(x => x.Items)
                .Must(item => item.File == null || item.File.Length > 0)
                .WithMessage("File is optional, but if specified, can not be empty");
            RuleForEach(x => x.Items)
                .Must(item => item.Geometry == null || (item.Geometry.Coordinates != null && item.Geometry.Coordinates.Count > 0))
                .WithMessage("Geometry is optional, but if specified, coordinates must contain at least one coordinate set");
            RuleForEach(x => x.Items)
                .Must(item => item.Geometry == null || (item.Geometry.Coordinates != null && item.Geometry.Coordinates.All(coordinate => coordinate.Length >= 3)))
                .WithMessage("3 or more coordinate points expected per coordinate set i.e. Point: X-coordinate (longitude -180 to +180), Y-coordinate (latitude -90 to +90), Z-elevation");
            RuleFor(x => x.DateStart).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(model => model.DateEnd)
                .GreaterThanOrEqualTo(model => model.DateStart)
                .When(model => model.DateEnd.HasValue)
                .WithMessage("{PropertyName} is earlier than the Start Date.");
        }
        #endregion

        #region Private Members
        private bool VerificationTypeExist(Guid? id)
        {
            if (!id.HasValue) return true;
            return _opportunityVerificationTypeService.GetByIdOrNull(id.Value) != null;
        }
        #endregion
    }
}
