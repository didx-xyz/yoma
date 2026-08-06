using FluentValidation;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Validators
{
  public class SchemaRequestValidatorCreate : SchemaRequestValidatorBase<SSISchemaRequestCreate>
  {
    #region Class Variables
    private readonly ISSISchemaTypeService _ssiSchemaTypeService;
    private readonly IOpportunityTypeService _opportunityTypeService;
    #endregion

    #region Constructor
    public SchemaRequestValidatorCreate(ISSISchemaEntityService ssiSchemaEntityService,
        ISSISchemaTypeService ssiSchemaTypeService,
        IOpportunityTypeService opportunityTypeService) : base(ssiSchemaEntityService)
    {
      _ssiSchemaTypeService = ssiSchemaTypeService;
      _opportunityTypeService = opportunityTypeService;

      RuleFor(o => o.Name).Must(name => !SSISSchemaHelper.SystemCharacters.Any(c => name.Contains(c))).WithMessage(name => $"{{PropertyName}} cannot contain system characters '{string.Join(' ', SSISSchemaHelper.SystemCharacters)}'");
      RuleFor(x => x.TypeId).NotEmpty().Must(TypeExists).WithMessage($"Specified type is invalid / does not exist.");
      RuleFor(x => x).Must(TypeContextValid).WithMessage("Specified type context is invalid or unsupported for the schema type.");
    }
    #endregion

    #region Private Members
    private bool TypeExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _ssiSchemaTypeService.GetById(id) != null;
    }

    private bool TypeContextValid(SSISchemaRequestCreate request)
    {
      if (request.TypeContext == null) return true;
      if (string.IsNullOrWhiteSpace(request.TypeContext) || request.TypeId == Guid.Empty) return false;

      var schemaType = _ssiSchemaTypeService.GetByIdOrNull(request.TypeId)?.Type;

      return schemaType switch
      {
        SchemaType.Opportunity => _opportunityTypeService.GetByNameOrNull(request.TypeContext.Trim()) != null,
        _ => false
      };
    }
    #endregion
  }
}
