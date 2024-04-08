namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IOrganizationBackgroundService
  {
    Task ProcessDeclination();

    Task ProcessDeletion();

    Task SeedLogoAndDocuments();
  }
}
