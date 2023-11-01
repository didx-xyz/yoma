using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces.Lookups
{
    public interface ISSITenantCreationStatusService
    {
        SSITenantCreationStatus GetByName(string name);

        SSITenantCreationStatus? GetByNameOrNull(string name);

        SSITenantCreationStatus GetById(Guid id);

        SSITenantCreationStatus? GetByIdOrNull(Guid id);

        List<SSITenantCreationStatus> List();
    }
}
