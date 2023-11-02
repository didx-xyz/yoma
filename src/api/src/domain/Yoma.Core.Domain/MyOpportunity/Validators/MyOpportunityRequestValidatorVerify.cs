using FluentValidation;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
    public class MyOpportunityRequestValidatorVerify : AbstractValidator<MyOpportunityRequestVerify>
    {
        #region Constructor
        public MyOpportunityRequestValidatorVerify()
        {
            RuleFor(x => x.Certificate).Must(file => file == null || file.Length > 0).WithMessage("{PropertyName} is optional, but if specified, cannot be empty.");
            RuleFor(x => x.VoiceNote).Must(file => file == null || file.Length > 0).WithMessage("{PropertyName} is optional, but if specified, cannot be empty.");
            RuleFor(x => x.Picture).Must(file => file == null || file.Length > 0).WithMessage("{PropertyName} is optional, but if specified, cannot be empty.");
            RuleFor(x => x.Geometry)
                .Must(x => x == null || (x.Coordinates != null && x.Coordinates.Count > 0))
                .WithMessage("Geometry is optional, but if specified, coordinates must contain at least one coordinate set.")
                .When(x => x.Geometry != null && x.Geometry.Type != Core.SpatialType.None);
            RuleFor(x => x.Geometry)
                .Must(x => x == null || (x.Coordinates != null && x.Coordinates.All(coordinate => coordinate.Length >= 3)))
                .WithMessage("3 or more coordinate points expected per coordinate set i.e. Point: X-coordinate (longitude -180 to +180), Y-coordinate (latitude -90 to +90), Z-elevation.")
                .When(x => x.Geometry != null && x.Geometry.Type != Core.SpatialType.None);
            RuleFor(x => x.DateStart).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(model => model.DateEnd)
                .GreaterThanOrEqualTo(model => model.DateStart)
                .When(model => model.DateEnd.HasValue)
                .WithMessage("{PropertyName} is earlier than the Start Date.");
        }
        #endregion
    }
}
