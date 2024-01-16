namespace Yoma.Core.Domain.Reward.Interfaces.Lookups
{
    public interface IWalletCreationStatusService
    {
        Models.Lookups.WalletCreationStatus GetByName(string name);

        Models.Lookups.WalletCreationStatus? GetByNameOrNull(string name);

        Models.Lookups.WalletCreationStatus GetById(Guid id);

        Models.Lookups.WalletCreationStatus? GetByIdOrNull(Guid id);

        List<Models.Lookups.WalletCreationStatus> List();
    }
}
