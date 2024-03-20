namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IOrganizationBackgroundService
  {
    void ProcessDeclination();

    void ProcessDeletion();

    void SeedLogoAndDocuments();
  }
}
