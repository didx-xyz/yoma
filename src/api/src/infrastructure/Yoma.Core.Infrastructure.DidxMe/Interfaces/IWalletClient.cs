using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  public interface IWalletClient
  {
    Task<WalletCredential> GetCredential(HolderContext context, string id, CancellationToken cancellationToken = default);

    Task<WalletCredential?> GetCredentialByIdOrNull(HolderContext context, string id, CancellationToken cancellationToken = default);

    Task<ApiResponse<List<WalletCredential>>> ListCredentialPage(HolderContext context, string? after = null,
      int pageSize = 100, WalletCredentialStatus status = WalletCredentialStatus.Accepted, CancellationToken cancellationToken = default);

    Task DeleteCredential(HolderContext context, string id, CancellationToken cancellationToken = default);
  }
}
