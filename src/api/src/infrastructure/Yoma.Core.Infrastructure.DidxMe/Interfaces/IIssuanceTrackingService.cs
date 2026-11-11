using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  public interface IIssuanceTrackingService
  {
    IssuanceMapping? Find(string holderId, KeyValuePair<string, string> referent);

    Task<IssuanceMapping> Create(IssuanceMapping item);

    Task<IssuanceMapping> Update(Guid id, Action<IssuanceMapping> update);

    Task Accept(string issuanceId, string walletId);

    Task<string> WaitForWalletId(Guid id, CancellationToken cancellationToken = default);

    Task ConfirmDeleted(string holderId, string walletId);
  }
}
