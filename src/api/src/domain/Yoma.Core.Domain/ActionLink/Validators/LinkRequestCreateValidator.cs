using FluentValidation;
using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Validators
{
  public class LinkRequestCreateValidator : AbstractValidator<LinkRequestCreate>
  {
    #region Public Members
    public LinkRequestCreateValidator()
    {
      RuleFor(x => x.Name).NotEmpty().Length(1, 255).WithMessage("'{PropertyName}' is required and must be between 1 and 255 characters long.");
      RuleFor(x => x.Description).Length(1, 500).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("'{PropertyName}' must be between 1 and 500 characters.");
      RuleFor(x => x.EntityId).Must(x => x != Guid.Empty).WithMessage("'{PropertyName}' is required.");
      RuleFor(x => x.URL).Length(1, 2048).Must(ValidURL).When(x => !string.IsNullOrEmpty(x.URL)).WithMessage("'{PropertyName}' must be between 1 and 2048 characters long and be a valid URL if specified.");
      RuleFor(x => x.UsagesLimit).Must(x => !x.HasValue || x > 0).When(x => x.UsagesLimit.HasValue).WithMessage("'{PropertyName}' must be greater than 0.");
      RuleFor(x => x.DateEnd).Must(date => !date.HasValue || date.Value > DateTimeOffset.UtcNow).WithMessage("'{PropertyName}' must be in the future.");
      //linkService ensure either a usage limit or an end date has been specified for link action 'Verify'
      //linkService ensure neither usage limit or end date has been specified for link action 'Share'
    }
    #endregion

    #region Private Members
    private bool ValidURL(string? url)
    {
      if (url == null) return true;
      return Uri.IsWellFormedUriString(url, UriKind.Absolute);
    }
    #endregion
  }
}
