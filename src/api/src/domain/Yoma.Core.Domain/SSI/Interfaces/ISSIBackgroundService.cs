namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSIBackgroundService
    {
        void ProcessTenantCreation();

        void ProcessCredentialIssuance();
    }
}
