namespace Yoma.Core.Domain.Core.Interfaces
{
  /// <summary>
  /// Protects sensitive values using Yoma's shared Data Protection key ring. Callers supply a
  /// stable, specific purpose to isolate concerns and bind ciphertext to its intended use.
  /// Replicas must share the application name and key ring. Encryption is never optional.
  /// </summary>
  public interface IEncryptionService
  {
    string Encrypt(string value, string purpose);

    string Decrypt(string value, string purpose);
  }
}
