namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSIBackgroundService
    {
        void SeedSchemas();

        void ProcessTenantCreation();

        void ProcessCredentialIssuance();
    }
}
