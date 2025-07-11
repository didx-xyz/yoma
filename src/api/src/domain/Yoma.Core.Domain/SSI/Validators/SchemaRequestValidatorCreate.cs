using FluentValidation;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Validators
{
  public class SchemaRequestValidatorCreate : SchemaRequestValidatorBase<SSISchemaRequestCreate>
  {
    #region Class Variables
    private readonly ISSISchemaTypeService _ssiSchemaTypeService;
    #endregion

    #region Constructor
    public SchemaRequestValidatorCreate(ISSISchemaEntityService ssiSchemaEntityService,
        ISSISchemaTypeService ssiSchemaTypeService) : base(ssiSchemaEntityService)
    {
      _ssiSchemaTypeService = ssiSchemaTypeService;

      RuleFor(o => o.Name).Must(name => !SSISSchemaHelper.SystemCharacters.Any(c => name.Contains(c))).WithMessage(name => $"{{PropertyName}} cannot contain system characters '{string.Join(' ', SSISSchemaHelper.SystemCharacters)}'");
      RuleFor(x => x.TypeId).NotEmpty().Must(TypeExists).WithMessage($"Specified type is invalid / does not exist.");
    }
    #endregion

    #region Private Members
    private bool TypeExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _ssiSchemaTypeService.GetById(id) != null;
    }
    #endregion
  }
}
