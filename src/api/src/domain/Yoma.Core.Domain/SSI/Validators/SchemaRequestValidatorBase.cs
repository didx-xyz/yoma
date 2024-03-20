using FluentValidation;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.SSI.Validators
{
  public class SchemaRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : SSISchemaRequestBase
  {
    #region Class Variables
    private readonly ISSISchemaEntityService _ssiSchemaEntityService;

    #endregion

    #region Constructorx
    public SchemaRequestValidatorBase(ISSISchemaEntityService ssiSchemaEntityService)
    {
      _ssiSchemaEntityService = ssiSchemaEntityService;

      RuleFor(x => x.Name).NotEmpty().WithMessage("{PropertyName} is required.");
      RuleFor(x => x.Attributes).Must(x => x.Count != 0 && x.All(attrib => !string.IsNullOrWhiteSpace(attrib) && AttributeExists(attrib)))
          .WithMessage($"{{PropertyName}} is required, cannot contain empty or non-existent value(s) cannot start with an {SSISchemaService.SchemaAttribute_Internal_Prefix}.");
    }
    #endregion

    #region Private Members
    private bool AttributeExists(string attrib)
    {
      if (string.IsNullOrWhiteSpace(attrib)) return false;
      return _ssiSchemaEntityService.GetByAttributeNameOrNull(attrib) != null;
    }
    #endregion
  }
}
