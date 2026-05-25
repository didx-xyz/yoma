using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncUserAuthenticationService
  {
    Task<SyncInfoEntity> Authenticate(Entity.Models.User user, SyncInfoEntity? syncInfo);
  }
}
