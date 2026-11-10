using Keycloak.AuthServices.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.Concurrent;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Infrastructure.Keycloak.Client;
using Yoma.Core.Infrastructure.Keycloak.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Test.SSI.DidxMe
{
  // Shared backing services model separate request scopes/replicas without touching local Valkey.
  internal sealed class HolderTokenCacheFixture
  {
    #region Class Variables
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    #endregion

    #region Public Properties
    public Mock<IDistributedCacheService> Cache { get; } = new();
    public Mock<ILogger<HolderAuthService>> Logger { get; } = new();
    public Mock<IDistributedLockService> Lock { get; } = new();
    public IDataProtectionProvider Protection { get; } = new EphemeralDataProtectionProvider();
    public IEncryptionService Encryption => new EncryptionService(Protection);
    public ConcurrentDictionary<string, string> Values { get; } = new();
    public ConcurrentDictionary<string, TimeSpan> Expirations { get; } = new();
    #endregion

    #region Constructor
    public HolderTokenCacheFixture()
    {
      Logger.Setup(logger => logger.IsEnabled(LogLevel.Error)).Returns(true);
      Cache.Setup(cache => cache.GetAsync<string>(It.IsAny<string>()))
        .ReturnsAsync((string key) => Values.TryGetValue(key, out var value) ? value : null);
      Cache.Setup(cache => cache.SetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
        .Returns((string key, string value, TimeSpan? expiry) =>
        {
          Values[key] = value;
          Expirations[key] = expiry!.Value;
          return Task.CompletedTask;
        });
      Cache.Setup(cache => cache.RemoveAsync(It.IsAny<string>()))
        .Returns((string key) =>
        {
          Values.TryRemove(key, out _);
          return Task.CompletedTask;
        });
      Lock.Setup(service => service.TryRunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(),
        It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>()))
        .Returns(async (string key, TimeSpan duration, TimeSpan timeout, Func<Task> action, CancellationToken cancellation, string process) =>
        {
          var gate = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
          if (!await gate.WaitAsync(timeout, cancellation)) return false;
          try
          {
            // Force an asynchronous boundary so competing scopes exercise the lock's wait path.
            await Task.Yield();
            await action();
            return true;
          }
          finally
          {
            gate.Release();
          }
        });
    }

    #endregion

    #region Public Members
    public HolderAuthService Create(ProviderOptions options, string identitySecret = "test-only",
      IIdentityProviderClientFactory? identityProvider = null, TimeProvider? timeProvider = null)
    {
      var factory = new Mock<IIdentityProviderClientFactory>();
      factory.Setup(value => value.CreateClient()).Returns(() => new KeycloakClient(
        NullLogger<KeycloakClient>.Instance, new AppSettings(), Mock.Of<IEnvironmentProvider>(),
        new KeycloakAdminOptions
        {
          Admin = new KeycloakCredentials { Realm = "master", Username = "test", Password = "test" },
          TokenExchange = new TokenExchangeOptions
          {
            ClientId = "assertion-client",
            ClientSecret = identitySecret,
            RequestTimeoutSeconds = 30
          }
        }, new KeycloakAuthenticationOptions
        {
          AuthServerUrl = "https://yoma.example.test",
          Realm = "yoma"
        }));
      return new(Options.Create(options), Cache.Object, Lock.Object, Encryption, Logger.Object,
        identityProvider ?? factory.Object, timeProvider);
    }
    #endregion
  }
}
