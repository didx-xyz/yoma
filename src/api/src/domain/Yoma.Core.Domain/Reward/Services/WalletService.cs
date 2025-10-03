using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Lookups;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Domain.Reward.Validators;

namespace Yoma.Core.Domain.Reward.Services
{
  public class WalletService : IWalletService
  {
    #region Class Variables
    private readonly ILogger<IWalletService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IRewardProviderClient _rewardProviderClient;
    private readonly IUserService _userService;
    private readonly IWalletCreationStatusService _walletCreationStatusService;
    private readonly IRewardService _rewardService;
    private readonly IRepository<WalletCreation> _walletCreationRepository;
    private readonly WalletVoucherSearchFilterValidator _walletVoucherSearchFilterValidator;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public WalletService(ILogger<IWalletService> logger,
        IOptions<AppSettings> appSettings,
        IHttpContextAccessor httpContextAccessor,
        IRewardProviderClientFactory rewardProviderClientFactory,
        IUserService userService,
        IRewardService rewardService,
        IWalletCreationStatusService walletCreationStatusService,
        IRepository<WalletCreation> walletCreationRepository,
        WalletVoucherSearchFilterValidator walletVoucherSearchFilterValidator,
        IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _httpContextAccessor = httpContextAccessor;
      _rewardProviderClient = rewardProviderClientFactory.CreateClient();
      _appSettings = appSettings.Value;
      _userService = userService;
      _rewardService = rewardService;
      _walletCreationStatusService = walletCreationStatusService;
      _walletCreationRepository = walletCreationRepository;
      _walletVoucherSearchFilterValidator = walletVoucherSearchFilterValidator;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public (string username, string walletId) GetWalletId(Guid userId)
    {
      var (username, walletId) = GetWalletIdOrNull(userId);

      if (string.IsNullOrEmpty(walletId))
        throw new EntityNotFoundException($"Wallet id not found for user with id '{userId}'");

      if (string.IsNullOrEmpty(username))
        throw new InvalidOperationException($"Wallet id found for user with id '{userId}' but username is empty");

      return (username, walletId);
    }

    public (string? username, string? walletId) GetWalletIdOrNull(Guid userId)
    {
      var user = _userService.GetById(userId, false, false);

      var statusCreatedId = _walletCreationStatusService.GetByName(WalletCreationStatus.Created.ToString()).Id;

      var result = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.StatusId == statusCreatedId);

      if (result != null && string.IsNullOrEmpty(result.WalletId))
        throw new DataInconsistencyException($"Wallet id expected with wallet creation status of '{WalletCreationStatus.Created}' for item with id '{result.Id}'");

      return (result?.Username, result?.WalletId);
    }

    public async Task<(WalletCreationStatus status, WalletBalance balance)> GetWalletStatusAndBalance(Guid userId)
    {
      var user = _userService.GetById(userId, false, false);
      var item = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == user.Id);

      var status = item?.Status ?? WalletCreationStatus.Unscheduled;

      var rewardTransactions = _rewardService.ListPendingTransactionSchedule(user.Id);

      var balance = new WalletBalance { Pending = rewardTransactions.Sum(o => o.Amount) };

      switch (status)
      {
        case WalletCreationStatus.Unscheduled:
        case WalletCreationStatus.Pending:
        case WalletCreationStatus.Error:
          break;

        case WalletCreationStatus.PendingUsernameUpdate:
        case WalletCreationStatus.Created:
          if (item == null)
            throw new InvalidOperationException($"Wallet creation item excepted with status '{status}'");

          if (string.IsNullOrEmpty(item.WalletId))
            throw new DataInconsistencyException($"Wallet id expected with wallet creation status of 'Created' for item with id '{item.Id}'");

          balance.WalletId = item.WalletId;
          balance.WalletUsername = item.Username;

          try
          {
            var wallet = await _rewardProviderClient.GetWallet(item.WalletId);
            balance.Available = wallet.Balance;
          }
          catch
          {
            balance.Available = decimal.Zero;
            balance.ZltoOffline = true;
          }
          break;
        default:
          throw new InvalidOperationException($"Status of '{status}' not supported");
      }

      balance.Total = balance.Pending + balance.Available;
      return (status, balance);
    }

    public async Task<WalletVoucherSearchResults> SearchVouchers(WalletVoucherSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      await _walletVoucherSearchFilterValidator.ValidateAndThrowAsync(filter);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var item = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == user.Id) ?? throw new ValidationException($"Wallet creation for the user with username '{user.Username}' hasn't been scheduled. Kindly log out and log back in");

      if (item.Status != WalletCreationStatus.Created)
        throw new ValidationException("Your wallet creation is currently pending. It will be available within 24 hours, please try again later");

      if (string.IsNullOrEmpty(item.WalletId))
        throw new DataInconsistencyException($"Wallet id expected with wallet creation status of 'Created' for item with id '{item.Id}'");

      var offset = default(int?);
      if (filter.PaginationEnabled)
        offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

      var result = new WalletVoucherSearchResults
      { Items = await _rewardProviderClient.ListWalletVouchers(item.WalletId, filter.PageSize, offset) };

      return result;
    }

    public async Task<(string username, Wallet wallet)> CreateWallet(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var user = _userService.GetById(userId, false, false);

      var rewardTransactions = _rewardService.ListPendingTransactionSchedule(user.Id);

      //query pending rewards and calculate balance
      var balance = rewardTransactions.Sum(o => o.Amount);
      var username = ParseWalletUsername(user);

      //attempt wallet creation
      var request = new WalletRequestCreate
      {
        Username = username,
        DisplayName = user.DisplayName ?? user.Username,
        Balance = balance
      };

      var (wallet, status) = await _rewardProviderClient.CreateWallet(request);

      switch (status)
      {
        case Models.Provider.WalletCreationStatus.Existing:
          break;

        case Models.Provider.WalletCreationStatus.Created:
          if (wallet.Balance != balance)
            throw new InvalidOperationException($"Initial wallet balance mismatch detected for user with id '{userId}': Calculated '{balance:0.00}' vs. Processed '{wallet.Balance:0.00}'");

          if (string.IsNullOrEmpty(wallet.Id))
            throw new InvalidOperationException($"Wallet id expected with wallet creation status of '{WalletCreationStatus.Created}' for user with id '{userId}'");

          rewardTransactions.ForEach(o => o.Status = RewardTransactionStatus.ProcessedInitialBalance);

          await _rewardService.UpdateTransactions(rewardTransactions);
          //flag pending rewards as processed
          break;

        default:
          throw new InvalidOperationException($"Status of '{status}' not supported");
      }

      return (username, wallet);
    }

    /// <summary>
    /// Attempts to create a wallet immediately for the specified user.  
    /// If the wallet already exists:
    ///   - If not yet created, does nothing further (already pending/in progress).  
    ///   - If created, checks if the username has changed and updates it inline,  
    ///     scheduling a username update only if the inline update fails.  
    /// If the wallet does not exist:
    ///   - Attempts inline creation, setting Username, WalletId, Balance, and marking as Created.  
    ///   - On failure, schedules creation by inserting a Pending record.  
    /// </summary>
    public async Task CreateWalletOrScheduleCreation(Guid? userId)
    {
      if (!userId.HasValue || userId.Value == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var existingItem = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == userId.Value);
      if (existingItem != null)
      {
        _logger.LogInformation("Wallet creation skipped: Already '{status}' for user with id '{userId}'", existingItem.Status, userId.Value);

        if (existingItem.Status != WalletCreationStatus.Created)
        {
          _logger.LogInformation("Wallet username update skipped: Current status '{status}' for user with id '{userId}'", existingItem.Status, userId.Value);
          return;
        }

        var user = _userService.GetById(userId.Value, false, false);

        if (string.IsNullOrEmpty(existingItem.Username))
          throw new InvalidOperationException($"Created Wallet: Wallet username expected for user with id {userId.Value}");

        var username = ParseWalletUsername(user);

        if (string.Equals(existingItem.Username, username, StringComparison.InvariantCultureIgnoreCase))
        {
          _logger.LogInformation("Wallet username update skipped: Username is already up to date for user with id '{userId}'", userId.Value);
          return;
        }

        try
        {

          await _rewardProviderClient.UpdateWalletUsername(existingItem.Username, username);
          existingItem.Username = username;
          //status remains created
        }
        catch
        {
          //schedule username update for delayed execution
          existingItem.StatusId = _walletCreationStatusService.GetByName(WalletCreationStatus.PendingUsernameUpdate.ToString()).Id;
          existingItem.Status = WalletCreationStatus.PendingUsernameUpdate;
        }

        await _walletCreationRepository.Update(existingItem);

        return;
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        var item = new WalletCreation { UserId = userId.Value };
        try
        {
          var (username, wallet) = await CreateWallet(userId.Value);

          item.Username = username;
          item.WalletId = wallet.Id;
          item.Balance = wallet.Balance; //track initial balance upon creation, if any
          item.StatusId = _walletCreationStatusService.GetByName(WalletCreationStatus.Created.ToString()).Id;
          item.Status = WalletCreationStatus.Created;
        }
        catch (Exception)
        {
          //schedule creation for delayed execution
          item.StatusId = _walletCreationStatusService.GetByName(WalletCreationStatus.Pending.ToString()).Id;
          item.Status = WalletCreationStatus.Pending;
        }

        await _walletCreationRepository.Create(item);

        scope.Complete();
      });
    }

    /// <summary>
    /// Schedules wallet creation or username update for the specified user.  
    /// If the wallet already exists:
    ///   - If not yet created, does nothing further (already pending/in progress).  
    ///   - If created, checks if the username has changed and schedules a username update (no inline update).  
    /// If the wallet does not exist:
    ///   - Schedules creation by inserting a Pending record (no inline creation attempted).  
    /// This method never creates or updates a wallet inline; it only schedules work for the background job.  
    /// </summary>
    public async Task ScheduleWalletCreation(Guid? userId)
    {
      if (!userId.HasValue || userId.Value == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var existingItem = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == userId.Value);
      if (existingItem != null)
      {
        _logger.LogInformation("Wallet creation skipped: Already '{status}' for user with id '{userId}'", existingItem.Status, userId.Value);

        if (existingItem.Status != WalletCreationStatus.Created)
        {
          _logger.LogInformation("Wallet username update skipped: Current status '{status}' for user with id '{userId}'", existingItem.Status, userId.Value);
          return;
        }

        var user = _userService.GetById(userId.Value, false, false);

        if (string.IsNullOrEmpty(existingItem.Username))
          throw new InvalidOperationException($"Created Wallet: Wallet username expected for user with id {userId.Value}");

        var username = ParseWalletUsername(user);

        if (string.Equals(existingItem.Username, username, StringComparison.InvariantCultureIgnoreCase))
        {
          _logger.LogInformation("Wallet username update skipped: Username is already up to date for user with id '{userId}'", userId.Value);
          return;
        }

        //schedule username update for delayed execution
        existingItem.StatusId = _walletCreationStatusService.GetByName(WalletCreationStatus.PendingUsernameUpdate.ToString()).Id;
        existingItem.Status = WalletCreationStatus.PendingUsernameUpdate;

        await _walletCreationRepository.Update(existingItem);
        return;
      }

      //schedule creation for delayed execution
      var item = new WalletCreation
      {
        UserId = userId.Value,
        StatusId = _walletCreationStatusService.GetByName(WalletCreationStatus.Pending.ToString()).Id,
        Status = WalletCreationStatus.Pending
      };

      await _walletCreationRepository.Create(item);
    }

    public async Task<string> UpdateWalletUsername(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var user = _userService.GetById(userId, false, false);

      var existingItem = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == userId) ?? throw new InvalidOperationException($"Wallet creation item expected for user with id '{userId}'");

      if (existingItem.Status != WalletCreationStatus.PendingUsernameUpdate)
        throw new InvalidOperationException($"Expected status '{WalletCreationStatus.PendingUsernameUpdate}', but found '{existingItem.Status}' for user with id '{userId}'");

      if (string.IsNullOrEmpty(existingItem.Username))
        throw new InvalidOperationException($"Username expected for user with id '{userId}' with a created wallet");

      var username = ParseWalletUsername(user);

      if (string.Equals(existingItem.Username, username, StringComparison.InvariantCultureIgnoreCase))
        return username;

      await _rewardProviderClient.UpdateWalletUsername(existingItem.Username, username);

      return username;
    }

    public List<WalletCreation> ListPendingCreationSchedule(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusPendingIds = new List<Guid>
      {
        _walletCreationStatusService.GetByName(WalletCreationStatus.Pending.ToString()).Id,
        _walletCreationStatusService.GetByName(WalletCreationStatus.PendingUsernameUpdate.ToString()).Id
      };

      var query = _walletCreationRepository.Query().Where(o => statusPendingIds.Contains(o.StatusId));

      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return results;
    }

    public async Task UpdateScheduleCreation(WalletCreation item, WalletCreationStatus retryStatusOnFailure)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      item.WalletId = item.WalletId?.Trim();

      var statusId = _walletCreationStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      switch (item.Status)
      {
        case WalletCreationStatus.Created:
          if (string.IsNullOrEmpty(item.WalletId))
            throw new ArgumentNullException(nameof(item), "Wallet id required");

          if (string.IsNullOrEmpty(item.Username))
            throw new ArgumentNullException(nameof(item), "Wallet username required");

          if (!item.Balance.HasValue)
            throw new ArgumentNullException(nameof(item), "Balance required (even if 0)");

          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case WalletCreationStatus.Error:
          if (string.IsNullOrEmpty(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), "Error reason required");

          item.ErrorReason = item.ErrorReason?.Trim();
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          //retry attempts specified and exceeded (-1: infinite retries)
          if (_appSettings.RewardMaximumRetryAttempts == 0 ||
            _appSettings.RewardMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.RewardMaximumRetryAttempts) break;

          item.StatusId = _walletCreationStatusService.GetByName(retryStatusOnFailure.ToString()).Id;

          item.Status = retryStatusOnFailure switch
          {
            WalletCreationStatus.Pending or WalletCreationStatus.PendingUsernameUpdate => retryStatusOnFailure,
            _ => throw new InvalidOperationException($"Retry status of '{retryStatusOnFailure}' not supported"),
          };
          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }

      await _walletCreationRepository.Update(item);
    }
    #endregion

    #region Private Members
    private static string ParseWalletUsername(User user)
    {
      var username = user.Username;
      if (!username.Contains('@')) username = $"{username}@{Constants.System_Domain}";
      return username;
    }
    #endregion
  }
}
