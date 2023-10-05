using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Validators
{
    public class SchemaRequestValidatorUpdate : SchemaRequestValidatorBase<SSISchemaRequestUpdate>
    {
        #region Constructor
        public SchemaRequestValidatorUpdate(ISSISchemaEntityService ssiSchemaEntityService) : base(ssiSchemaEntityService)
        {
        }
        #endregion
    }
}
