namespace Yoma.Core.Domain.RewardsProvider.Interfaces
{
    public interface IRewardsProviderClientFactory
    {
        IRewardsProviderClient CreateClient();
    }
}
