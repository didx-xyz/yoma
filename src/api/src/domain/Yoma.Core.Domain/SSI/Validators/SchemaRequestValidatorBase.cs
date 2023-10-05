using FluentValidation;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Validators
{
    public class SchemaRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : SSISchemaRequestBase
    {
        #region Class Variables
        private readonly ISSISchemaEntityService _ssiSchemaEntityService;
        
        #endregion

        #region Constructor
        public SchemaRequestValidatorBase(ISSISchemaEntityService ssiSchemaEntityService)
        {
            _ssiSchemaEntityService = ssiSchemaEntityService;

            RuleFor(x => x.Name).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.Attributes).Must(x => x.Any() && x.All(attrib => !string.IsNullOrWhiteSpace(attrib) && AttributeExist(attrib)))
                .WithMessage("{PropertyName} is required, cannot contain empty or non-existent value(s).");
        }
        #endregion

        #region Private Members
        private bool AttributeExist(string attrib)
        {
            return _ssiSchemaEntityService.GetByAttributeNameOrNull(attrib) != null;
        }
        #endregion
    }
}
