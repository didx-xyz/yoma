using FluentValidation;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Validators
{
    public class SchemaRequestValidator : AbstractValidator<SSISchemaRequest>
    {
        #region Class Variables
        private readonly ISSISchemaEntityService _ssiSchemaEntityService;
        private readonly ISSISchemaTypeService _ssiSchemaTypeService;
        #endregion

        #region Constructor
        public SchemaRequestValidator(ISSISchemaEntityService ssiSchemaEntityService,
            ISSISchemaTypeService ssiSchemaTypeService)
        {
            _ssiSchemaEntityService = ssiSchemaEntityService;
            _ssiSchemaTypeService = ssiSchemaTypeService;

            RuleFor(x => x.Name).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.TypeId).NotEmpty().Must(TypeExists).WithMessage($"Specified type is invalid / does not exist.");
            RuleFor(x => x.Attributes).Must(x => x.Any() && x.All(attrib => !string.IsNullOrWhiteSpace(attrib) && AttributeExist(attrib)))
                .WithMessage("{PropertyName} is required, cannot contain empty or non-existent value(s).");
        }
        #endregion

        #region Private Members
        private bool AttributeExist(string attrib)
        {
            return _ssiSchemaEntityService.GetByAttributeNameOrNull(attrib) != null;
        }

        private bool TypeExists(Guid typeId)
        {
            return _ssiSchemaTypeService.GetById(typeId) != null;
        }
        #endregion
    }
}
