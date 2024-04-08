namespace Yoma.Core.Domain.SSI.Interfaces
{
  public interface ISSIBackgroundService
  {
    Task SeedSchemas();

    Task ProcessTenantCreation();

    Task ProcessCredentialIssuance();
  }
}
