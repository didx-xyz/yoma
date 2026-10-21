namespace Yoma.Core.Domain.SSI.Interfaces
{
  /// <summary>
  /// Background processing for provider schemas, tenant creation and credential issuance.
  /// See the Replay migration/job runbook on <see cref="Services.SSIBackgroundService"/>.
  /// </summary>
  public interface ISSIBackgroundService
  {
    Task SeedSchemas();

    Task ProcessTenantCreation();

    Task ProcessCredentialIssuance();
  }
}
