using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces.Lookups
{
    public interface ISSIWalletCreationStatusService
    {
        SSIWalletCreationStatus GetByName(string name);

        SSIWalletCreationStatus? GetByNameOrNull(string name);

        SSIWalletCreationStatus GetById(Guid id);

        SSIWalletCreationStatus? GetByIdOrNull(Guid id);

        List<SSIWalletCreationStatus> List();
    }
}
