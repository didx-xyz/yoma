using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
  public class MyOpportunityRequestValidatorVerifyImportCsv : AbstractValidator<MyOpportunityRequestVerifyImportCsv>
  {
    #region Class Variables
    private readonly IOrganizationService _organizationService;
    #endregion

    #region Constructor
    public MyOpportunityRequestValidatorVerifyImportCsv(IOrganizationService organizationService)
    {
      _organizationService = organizationService;

      RuleFor(x => x.File).Must(file => file != null && file.Length > 0).WithMessage("{PropertyName} is required.");
      RuleFor(x => x.OrganizationId).NotEmpty().Must(OrganizationExists).WithMessage($"Specified organization does not exist.");
    }
    #endregion

    #region Private Members
    private bool OrganizationExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _organizationService.GetByIdOrNull(id, false, false, false) != null;
    }
    #endregion
  }
}
