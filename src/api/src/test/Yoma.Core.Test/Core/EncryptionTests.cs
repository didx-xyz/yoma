using Microsoft.AspNetCore.DataProtection;
using System.Security.Cryptography;
using Xunit;
using Yoma.Core.Domain.Core.Services;

namespace Yoma.Core.Test.Core
{
  public class EncryptionTests
  {
    #region Tests
    [Fact]
    public void SharedKeyRingSupportsDifferentServiceInstancesButIsolatesPurposes()
    {
      var provider = new EphemeralDataProtectionProvider();
      var writer = new EncryptionService(provider);
      var reader = new EncryptionService(provider);
      var encrypted = writer.Encrypt("synthetic-sensitive-value", "test:holder:a");

      Assert.DoesNotContain("synthetic-sensitive-value", encrypted);
      Assert.Equal("synthetic-sensitive-value", reader.Decrypt(encrypted, "test:holder:a"));
      Assert.Throws<CryptographicException>(() => reader.Decrypt(encrypted, "test:holder:b"));
      Assert.Throws<CryptographicException>(() => reader.Decrypt("corrupted", "test:holder:a"));
      Assert.Throws<CryptographicException>(() =>
        new EncryptionService(new EphemeralDataProtectionProvider()).Decrypt(encrypted, "test:holder:a"));
    }
    #endregion Tests
  }
}
