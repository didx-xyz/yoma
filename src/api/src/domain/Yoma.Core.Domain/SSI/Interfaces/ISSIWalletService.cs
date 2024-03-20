using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Interfaces
{
  public interface ISSIWalletService
  {
    Task<SSICredential> GetUserCredentialById(string id);

    Task<SSIWalletSearchResults> SearchUserCredentials(SSIWalletFilter filter);
  }
}
