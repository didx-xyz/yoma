using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Transactions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;
using Yoma.Core.Domain.Marketplace.Interfaces.Provider;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Validators;
using Yoma.Core.Domain.Reward.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class MarketplaceService : IMarketplaceService
  {
    #region Class Variables
    private readonly ILogger<MarketplaceService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ICountryService _countryService;
    private readonly IUserService _userService;
    private readonly IWalletService _walletService;
    private readonly IMarketplaceProviderClient _marketplaceProviderClient;
    private readonly ITransactionStatusService _transactionStatusService;
    private readonly IRepository<TransactionLog> _transactionLogRepository;
    private readonly StoreSearchFilterValidator _storeSearchFilterValidator;
    private readonly StoreItemCategorySearchFilterValidator _storeItemCategorySearchFilterValidator;
    private readonly StoreItemSearchFilterValidator _storeItemSearchFilterValidator;

    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructors
    public MarketplaceService(ILogger<MarketplaceService> logger,
        IHttpContextAccessor httpContextAccessor,
        ICountryService countryService,
        IUserService userService,
        IWalletService walletService,
        IMarketplaceProviderClientFactory marketplaceProviderClientFactory,
        ITransactionStatusService transactionStatusService,
        IRepository<TransactionLog> transactionLogRepository,
        StoreSearchFilterValidator storeSearchFilterValidator,
        StoreItemCategorySearchFilterValidator storeItemCategorySearchFilterValidator,
        StoreItemSearchFilterValidator storeItemSearchFilterValidator,
        IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _httpContextAccessor = httpContextAccessor;
      _countryService = countryService;
      _userService = userService;
      _walletService = walletService;
      _marketplaceProviderClient = marketplaceProviderClientFactory.CreateClient();
      _transactionStatusService = transactionStatusService;
      _transactionLogRepository = transactionLogRepository;
      _storeSearchFilterValidator = storeSearchFilterValidator;
      _storeItemCategorySearchFilterValidator = storeItemCategorySearchFilterValidator;
      _storeItemSearchFilterValidator = storeItemSearchFilterValidator;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public List<Country> ListSearchCriteriaCountries()
    {
      Country? country = null;
      if (HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor))
      {
        var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        country = user.CountryId.HasValue ? _countryService.GetByIdOrNull(user.CountryId.Value) : null;
      }

      var countryCodesAlpha2Available = _marketplaceProviderClient.ListSupportedCountryCodesAlpha2(country?.CodeAlpha2);

      var results = _countryService.List().Where(o => countryCodesAlpha2Available.Contains(o.CodeAlpha2, StringComparer.InvariantCultureIgnoreCase))
          .OrderBy(o => o.CodeAlpha2 != Core.Country.Worldwide.ToDescription()).ThenBy(o => o.Name).ToList(); //esnure Worldwide appears first

      return results;
    }

    public async Task<List<StoreCategory>> ListStoreCategories(string countryCodeAlpha2)
    {
      var country = _countryService.GetByCodeAplha2(countryCodeAlpha2);

      return await _marketplaceProviderClient.ListStoreCategories(country.CodeAlpha2);
    }

    public async Task<StoreItemCategorySearchResults> SearchStoreItemCategories(StoreItemCategorySearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      await _storeItemCategorySearchFilterValidator.ValidateAndThrowAsync(filter);

      var offset = default(int?);
      if (filter.PaginationEnabled)
        offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

      var result = new StoreItemCategorySearchResults
      { Items = await _marketplaceProviderClient.ListStoreItemCategories(filter.StoreId, filter.PageSize, offset) };

      return result;
    }

    public async Task<StoreSearchResults> SearchStores(StoreSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      await _storeSearchFilterValidator.ValidateAndThrowAsync(filter);

      var offset = default(int?);
      if (filter.PaginationEnabled)
        offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

      var result = new StoreSearchResults
      { Items = await _marketplaceProviderClient.ListStores(filter.CountryCodeAlpha2, filter.CategoryId, filter.PageSize, offset) };

      return result;
    }

    public async Task<StoreItemSearchResults> SearchStoreItems(StoreItemSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      await _storeItemSearchFilterValidator.ValidateAndThrowAsync(filter);

      var offset = default(int?);
      if (filter.PaginationEnabled)
        offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

      var result = new StoreItemSearchResults
      { Items = await _marketplaceProviderClient.ListStoreItems(filter.StoreId, filter.ItemCategoryId, filter.PageSize, offset) };

      return result;
    }

    public async Task BuyItem(string storeId, string itemCategoryId)
    {
      if (string.IsNullOrEmpty(storeId))
        throw new ArgumentNullException(nameof(storeId));
      storeId = storeId.Trim();

      if (string.IsNullOrEmpty(itemCategoryId))
        throw new ArgumentNullException(nameof(itemCategoryId));
      itemCategoryId = itemCategoryId.Trim();

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var (walletStatus, walletBalance) = await _walletService.GetWalletStatusAndBalance(user.Id);

      if (walletStatus != Reward.WalletCreationStatus.Created)
        throw new ValidationException($"The wallet creation for the user with email '{user.Email}' is currently pending. Please try again later or contact technical support for assistance");

      if (string.IsNullOrEmpty(walletBalance.WalletId))
        throw new InvalidOperationException($"Wallet id expected with status '{walletStatus}'");

      //find the 1st available item for the specified store and item category
      var storeItems = await _marketplaceProviderClient.ListStoreItems(storeId, itemCategoryId, 1, 0);
      if (storeItems.Count == 0)
        throw new ValidationException($"Items for the specified store and category has been sold out");
      var storeItem = storeItems.Single();

      if (walletBalance.Available < storeItem.Amount)
        throw new ValidationException($"Insufficient funds to purchase the item. Current available balance '{walletBalance.Available:N2}'");

      //find latest transaction for the user and item category
      var transactionExisting = _transactionLogRepository.Query()
        .Where(o => o.UserId == user.Id && o.ItemCategoryId == itemCategoryId)
        .OrderByDescending(o => o.DateModified).FirstOrDefault();

      //existing reservation re-used if available; assume remains effective and not expired by ZLTO
      var transaction = transactionExisting != null && transactionExisting.Status == TransactionStatus.Reserved
        ? transactionExisting : await BuyItemTransactionReserve(user, walletBalance.WalletId, itemCategoryId, storeItem);

      await BuyItemTransactionSold(transaction, user, walletBalance.WalletId);
    }

    /// <summary>
    /// Reserve item and log transaction; with failure attempt to reset / release reservation
    /// </summary>
    private async Task<TransactionLog> BuyItemTransactionReserve(User user, string walletId, string itemCategoryId, StoreItem storeItem)
    {
      var result = new TransactionLog
      {
        UserId = user.Id,
        ItemCategoryId = itemCategoryId,
        ItemId = storeItem.Id,
        Amount = storeItem.Amount
      };

      var reserved = false;
      try
      {
        result.TransactionId = await _marketplaceProviderClient.ItemReserve(walletId, user.Email, storeItem.Id);
        reserved = true;

        result.StatusId = _transactionStatusService.GetByName(TransactionStatus.Reserved.ToString()).Id;
        result.Status = TransactionStatus.Reserved;
        result = await _transactionLogRepository.Create(result);

        return result;
      }
      catch (Exception ex)
      {
        if (reserved) await BuyItemTransactionReserveReset(result);
        BuyItemLogException(ex, result, reserved ? "Reservation succeeded but failed to log transaction" : "Reservation failed");
        throw;
      }
    }

    /// <summary>
    /// Mark item as sold and log trasnaction; with failure attempt to reset / release reservation provided not sold
    /// </summary>
    private async Task BuyItemTransactionSold(TransactionLog transaction, User user, string walletId)
    {
      var sold = false;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

          transaction.StatusId = _transactionStatusService.GetByName(TransactionStatus.Sold.ToString()).Id;
          transaction.Status = TransactionStatus.Sold;
          transaction = await _transactionLogRepository.Create(transaction);

          await _marketplaceProviderClient.ItemSold(walletId, user.Email, transaction.ItemId, transaction.TransactionId);
          sold = true;

          scope.Complete();
        });
      }
      catch (Exception ex)
      {
        if (!sold) await BuyItemTransactionReserveReset(transaction);
        BuyItemLogException(ex, transaction, sold ? "Item marked as sold, but failed to log transaction" : "Failed to mark item as sold");
        throw;
      }
    }

    /// <summary>
    /// Attempt to reset / release reservation and log transaction; reservation logged and re-used with next attempt; no exception thrown upon failure
    /// </summary>
    /// <param name="transaction"></param>
    private async Task BuyItemTransactionReserveReset(TransactionLog transaction)
    {
      var reserveReset = false;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

          transaction.StatusId = _transactionStatusService.GetByName(TransactionStatus.Released.ToString()).Id;
          transaction.Status = TransactionStatus.Released;
          await _transactionLogRepository.Create(transaction);

          await _marketplaceProviderClient.ItemReserveReset(transaction.ItemId, transaction.TransactionId);
          reserveReset = true;

          scope.Complete();
        });
      }
      catch (Exception ex)
      {
        BuyItemLogException(ex, transaction, reserveReset ? "Reservation reset succeeded but failed to log transaction" : "Reservation reset failed");
      }
    }

    private void BuyItemLogException(Exception ex, TransactionLog transaction, string messageSuffix)
    {
      _logger.LogError(ex, "Failed to execute '{status}' action for user id '{userId}', item category id '{itemCategoryId}', item id '{itemId}' (transaction id '{transactionId}'): {messageSuffix}",
        TransactionStatus.Released, transaction.Id, transaction.ItemCategoryId.SanitizeLogValue(), transaction.ItemId.SanitizeLogValue(),
        string.IsNullOrEmpty(transaction.TransactionId) ? "n/a" : transaction.TransactionId.SanitizeLogValue(),
        messageSuffix.SanitizeLogValue());
    }
    #endregion
  }
}
