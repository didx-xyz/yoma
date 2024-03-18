using FluentValidation;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Services;

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

            var fullName = string.Empty;
            var systemCharacters = SSISchemaService.SchemaName_SystemCharacters.Union(new[] { SSISchemaService.SchemaName_TypeDelimiter }); //i.e. Opportunity|Learning

            RuleFor(x => x.TypeId).NotEmpty().Must(TypeExists).WithMessage($"Specified type is invalid / does not exist.");
            RuleFor(o => o.Name).Must(name => !systemCharacters.Any(c => name.Contains(c))).WithMessage(name => $"{{PropertyName}} cannot contain system characters '{string.Join(' ', systemCharacters)}'");
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
