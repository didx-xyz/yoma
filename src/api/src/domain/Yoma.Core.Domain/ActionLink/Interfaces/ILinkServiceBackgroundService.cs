namespace Yoma.Core.Domain.ActionLink.Interfaces
{
  public interface ILinkServiceBackgroundService
  {
    Task ProcessExpiration();

    Task ProcessDeclination();

    Task ProcessDeletion();
  }
}
