using Microsoft.AspNetCore.DataProtection;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  /// <summary>
  /// Common authenticated encryption using the same Protect/Unprotect approach as the Aries SDK.
  /// Key storage/rotation belongs to the host's existing Data Protection registration, not callers.
  /// Uses a separate purpose from Aries; no custom encryption key or plaintext fallback.
  /// </summary>
  public sealed class EncryptionService : IEncryptionService
  {
    #region Class Variables
    private readonly IDataProtector _protector;
    #endregion

    #region Constructor
    public EncryptionService(IDataProtectionProvider dataProtectionProvider)
    {
      ArgumentNullException.ThrowIfNull(dataProtectionProvider);
      _protector = dataProtectionProvider.CreateProtector("Yoma.Core.Encryption.v1");
    }
    #endregion

    #region Public Members
    public string Encrypt(string value, string purpose)
    {
      ArgumentNullException.ThrowIfNull(value);
      ArgumentException.ThrowIfNullOrWhiteSpace(purpose);

      return _protector.CreateProtector(purpose).Protect(value);
    }

    public string Decrypt(string value, string purpose)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(value);
      ArgumentException.ThrowIfNullOrWhiteSpace(purpose);

      return _protector.CreateProtector(purpose).Unprotect(value);
    }
    #endregion
  }
}
