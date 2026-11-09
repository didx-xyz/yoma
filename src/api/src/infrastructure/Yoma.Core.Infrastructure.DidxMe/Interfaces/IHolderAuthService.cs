using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  /// <summary>
  /// Supplies participant authentication with encrypted distributed reuse bound to the incoming
  /// Yoma token, mapped holder and provider context. Absolute expiry is never extended on reads.
  /// Requires an authenticated participant; it is not a background delegation mechanism.
  /// </summary>
  public interface IHolderAuthService
  {
    Task<KeyValuePair<string, string>> GetAuthHeader(HolderContext context,
      CancellationToken cancellationToken = default);

    Task Invalidate();
  }
}
