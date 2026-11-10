using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  /// <summary>
  /// Serializes journal writes from issuance, recovery and webhook requests across API instances.
  /// Transactions contain only local reads/writes; provider calls are never retried inside them.
  /// </summary>
  public class IssuanceTrackingService : IIssuanceTrackingService
  {
    #region Class Variables
    private readonly ILogger<IssuanceTrackingService> _logger;
    private readonly ProviderOptions _options;
    private readonly IRepository<IssuanceMapping> _repository;
    private readonly IProviderExecutionStrategyService _executionStrategy;
    #endregion

    #region Constructor
    public IssuanceTrackingService(ILogger<IssuanceTrackingService> logger, IOptions<ProviderOptions> options, IRepository<IssuanceMapping> repository,
      IProviderExecutionStrategyService executionStrategy)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = (options ?? throw new ArgumentNullException(nameof(options))).Value;
      _repository = repository ?? throw new ArgumentNullException(nameof(repository));
      _executionStrategy = executionStrategy ?? throw new ArgumentNullException(nameof(executionStrategy));
    }
    #endregion

    #region Public Members
    public IssuanceMapping? Find(string holderId, KeyValuePair<string, string> referent)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(holderId);
      ArgumentException.ThrowIfNullOrWhiteSpace(referent.Key);
      ArgumentException.ThrowIfNullOrWhiteSpace(referent.Value);

      return _repository.Query()
        .Where(item => item.TenantAlias == _options.TenantAlias &&
          item.TenantIdHolder == holderId &&
          item.ClientReferentKey == referent.Key &&
          item.ClientReferentValue == referent.Value &&
          item.Status != nameof(IssuanceStatus.Deleted))
        .OrderByDescending(item => item.DateCreated)
        .FirstOrDefault();
    }

    public async Task<IssuanceMapping> Create(IssuanceMapping item)
    {
      ArgumentNullException.ThrowIfNull(item);

      IssuanceMapping? result = null;
      await _executionStrategy.ExecuteInExecutionStrategyAsync(async () =>
      {
        // Reuse an existing attempt on retry; the issuance job owns execution concurrency.
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);
        result = Find(item.TenantIdHolder, new KeyValuePair<string, string>(item.ClientReferentKey, item.ClientReferentValue));
        result ??= await _repository.Create(item);
        scope.Complete();
      }, clearTrackedChanges: true);

      return result!;
    }

    public async Task<IssuanceMapping> Update(Guid id, Action<IssuanceMapping> update)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));
      ArgumentNullException.ThrowIfNull(update);

      IssuanceMapping? result = null;
      await _executionStrategy.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);
        result = _repository.Query(LockMode.Wait).Single(item => item.Id == id && item.TenantAlias == _options.TenantAlias);
        var issuanceId = result.IssuanceId;
        var issuerCredentialId = result.IssuerCredentialId;
        var walletCredentialId = result.WalletCredentialId;
        var deliveryCompleted = result.DeliveryCompleted;
        var status = Enum.Parse<IssuanceStatus>(result.Status, true);

        update(result);

        if ((issuanceId != null && issuanceId != result.IssuanceId) ||
          (issuerCredentialId != null && issuerCredentialId != result.IssuerCredentialId) ||
          (walletCredentialId != null && walletCredentialId != result.WalletCredentialId))
          throw new InvalidOperationException("A confirmed provider identifier cannot be replaced");

        var updatedStatus = Enum.Parse<IssuanceStatus>(result.Status, true);
        if (status == IssuanceStatus.Deleted && updatedStatus != IssuanceStatus.Deleted)
          throw new InvalidOperationException("A deleted issuance attempt cannot be resumed");

        result.DeliveryCompleted |= deliveryCompleted;
        await _repository.Update(result);
        scope.Complete();
      }, clearTrackedChanges: true);

      return result!;
    }

    public async Task Accept(string issuanceId, string walletId)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(issuanceId);
      ArgumentException.ThrowIfNullOrWhiteSpace(walletId);

      var mapping = _repository.Query().SingleOrDefault(item => item.TenantAlias == _options.TenantAlias && item.IssuanceId == issuanceId);
      // Other integrations may share an issuer. A known mapping is persisted before delivery.
      if (mapping == null) return;

      await Update(mapping.Id, item =>
      {
        var status = Enum.Parse<IssuanceStatus>(item.Status, true);
        if (status == IssuanceStatus.Deleted) return;

        if (item.WalletCredentialId != null && item.WalletCredentialId != walletId)
        {
          // Retrying this event cannot repair the conflict. Preserve the confirmed ID for reconciliation.
          if (_logger.IsEnabled(LogLevel.Error))
            _logger.LogError("Accepted wallet event conflicts with issuance mapping {mappingId}; the recorded wallet credential was retained", item.Id);

          return;
        }

        item.WalletCredentialId = walletId;
        item.Status = IssuanceStatus.Accepted.ToString();
      });
    }

    public async Task<string> WaitForWalletId(Guid id, CancellationToken cancellationToken = default)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));

      var deadline = DateTimeOffset.UtcNow.AddSeconds(_options.Webhook.WaitTimeoutSeconds);
      do
      {
        var mapping = _repository.Query().Single(item => item.Id == id && item.TenantAlias == _options.TenantAlias);
        var status = Enum.Parse<IssuanceStatus>(mapping.Status, true);
        if (status == IssuanceStatus.Deleted)
          throw new InvalidOperationException("The delivered credential was deleted before issuance completed");

        if (status == IssuanceStatus.Accepted && !string.IsNullOrWhiteSpace(mapping.WalletCredentialId))
          return mapping.WalletCredentialId;

        await Task.Delay(TimeSpan.FromMilliseconds(_options.Webhook.PollIntervalMilliseconds), cancellationToken);
      } while (DateTimeOffset.UtcNow < deadline);

      // Keep the journal: retry must inspect the wallet, never blindly issue another credential.
      throw new TimeoutException("Timed out waiting for the accepted-wallet event; issuance remains pending recovery");
    }

    public async Task ConfirmDeleted(string holderId, string walletId)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(holderId);
      ArgumentException.ThrowIfNullOrWhiteSpace(walletId);

      var ids = _repository.Query().Where(item => item.TenantAlias == _options.TenantAlias &&
        item.TenantIdHolder == holderId && item.WalletCredentialId == walletId).Select(item => item.Id).ToList();
      foreach (var id in ids)
        await Update(id, item => item.Status = IssuanceStatus.Deleted.ToString());
    }
    #endregion
  }
}
