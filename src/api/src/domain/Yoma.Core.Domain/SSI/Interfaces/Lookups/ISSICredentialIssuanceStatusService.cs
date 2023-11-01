using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces.Lookups
{
    public interface ISSICredentialIssuanceStatusService
    {
        SSICredentialIssuanceStatus GetByName(string name);

        SSICredentialIssuanceStatus? GetByNameOrNull(string name);

        SSICredentialIssuanceStatus GetById(Guid id);

        SSICredentialIssuanceStatus? GetByIdOrNull(Guid id);

        List<SSICredentialIssuanceStatus> List();
    }
}
