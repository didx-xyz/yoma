using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncUserAuthenticationService
  {
    Task<SyncInfoEntityPartner> Authenticate(Entity.Models.User user, SyncInfoEntityPartner partner);
  }
}
