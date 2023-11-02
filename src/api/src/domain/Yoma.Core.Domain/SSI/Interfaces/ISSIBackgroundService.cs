namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSIBackgroundService
    {
        void Seed();

        void ProcessTenantCreation();

        void ProcessCredentialIssuance();
    }
}
