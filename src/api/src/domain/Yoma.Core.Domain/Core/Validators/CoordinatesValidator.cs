using FluentValidation;

namespace Yoma.Core.Domain.Core.Validators
{
  public class CoordinatesValidator : AbstractValidator<double[]>
  {
    public CoordinatesValidator()
    {
      RuleFor(x => x).Cascade(CascadeMode.Stop)
        .Must(values => values.Length == 2)
        .WithMessage("Coordinates must contain exactly two values: longitude, latitude.")
        .Must(values => double.IsFinite(values[0]) && values[0] >= -180 && values[0] <= 180)
        .WithMessage("Longitude must be a finite value between -180 and 180.")
        .Must(values => double.IsFinite(values[1]) && values[1] >= -90 && values[1] <= 90)
        .WithMessage("Latitude must be a finite value between -90 and 90.");
    }
  }
}
