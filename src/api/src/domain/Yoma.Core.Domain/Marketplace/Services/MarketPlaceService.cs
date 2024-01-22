using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
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

        private static readonly object _lock_Object = new();
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
            StoreItemSearchFilterValidator storeItemSearchFilterValidator)
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
        }
        #endregion

        #region Public Members
        public List<Country> ListSearchCriteriaCountries()
        {
            Country? countryOfResidence = null;
            if (HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor))
            {
                var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
                countryOfResidence = user.CountryOfResidenceId.HasValue ? _countryService.GetByIdOrNull(user.CountryOfResidenceId.Value) : null;
            }

            var countryCodesAlpha2Available = _marketplaceProviderClient.ListSupportedCountryCodesAlpha2(countryOfResidence?.CodeAlpha2);

            var results = _countryService.List().Where(o => countryCodesAlpha2Available.Contains(o.CodeAlpha2, StringComparer.InvariantCultureIgnoreCase)).OrderBy(o => o.Name).ToList();

            return results;
        }

        public async Task<List<StoreCategory>> ListStoreCategories(string countryCodeAlpha2)
        {
            var country = _countryService.GetByCodeAplha2(countryCodeAlpha2);

            return await _marketplaceProviderClient.ListStoreCategories(country.CodeAlpha2);
        }

        public async Task<StoreItemCategorySearchResults> SearchStoreItemCategories(StoreItemCategorySearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

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
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

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
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            await _storeItemSearchFilterValidator.ValidateAndThrowAsync(filter);

            var offset = default(int?);
            if (filter.PaginationEnabled)
                offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

            var result = new StoreItemSearchResults
            { Items = await _marketplaceProviderClient.ListStoreItems(filter.StoreId, filter.ItemCategoryId, filter.PageSize, offset) };

            return result;
        }

        public void BuyItem(string storeId, string itemCategoryId)
        {
            if (string.IsNullOrEmpty(storeId))
                throw new ArgumentNullException(nameof(storeId));
            storeId = storeId.Trim();

            if (string.IsNullOrEmpty(itemCategoryId))
                throw new ArgumentNullException(nameof(itemCategoryId));
            itemCategoryId = itemCategoryId.Trim();

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

            var (userEmail, walletId) = _walletService.GetWalletIdOrNull(user.Id);
            if (string.IsNullOrEmpty(walletId))
                throw new ValidationException($"The wallet creation for the user with email '{user.Email}' is currently pending. Please try again later or contact technical support for assistance");

            var statusReleasedId = _transactionStatusService.GetByName(TransactionStatus.Released.ToString()).Id;
            var statusReservedId = _transactionStatusService.GetByName(TransactionStatus.Reserved.ToString()).Id;
            var statusSoldId = _transactionStatusService.GetByName(TransactionStatus.Sold.ToString()).Id;

            //lock retrieval (ListStoreItems), reservation (ItemReserve) and update as sold (ItemSold), ensuring single thread execution.
            //zlto allows processing of an item for multiple wallets, resulting in success (OK)
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                //find the 1st available item for the specified store and item category
                var storeItems = _marketplaceProviderClient.ListStoreItems(storeId, itemCategoryId, 1, 0).Result;
                if (!storeItems.Any())
                    throw new ValidationException($"Items for the specified store and category has been sold out");
                var storeItem = storeItems.Single();

                var item = new TransactionLog
                {
                    UserId = user.Id,
                    ItemCategoryId = itemCategoryId,
                    ItemId = storeItem.Id,
                    Amount = storeItem.Amount
                };

                //reserve item and track transaction
                var transactionId = _marketplaceProviderClient.ItemReserve(walletId, user.Email, storeItem.Id).Result;
                item.Status = TransactionStatus.Reserved;
                item.StatusId = statusReservedId;
                item.TransactionId = transactionId;
                _transactionLogRepository.Create(item).Wait();

                try
                {
                    //mark item as sold and track transaction   
                    _marketplaceProviderClient.ItemSold(walletId, user.Email, storeItem.Id, transactionId).Wait();
                    item.Status = TransactionStatus.Sold;
                    item.StatusId = statusSoldId;
                    _transactionLogRepository.Create(item).Wait();
                }
                catch (Exception)
                {
                    switch (item.Status)
                    {
                        case TransactionStatus.Sold:
                            //item flagged as sold but log could not commit; attempt to commit 'Sold' log again
                            try { _transactionLogRepository.Create(item).Wait(); }
                            catch (Exception) { throw; }
                            break;

                        case TransactionStatus.Reserved:
                            //attempt to release reservation and track transaction (upon failure assume zlto will expire reservation)
                            try
                            {
                                //can be invoke multiple times without any side effects (OK); with not found, assume reservation reset
                                _marketplaceProviderClient.ItemReserveReset(item.ItemId, item.TransactionId).Wait();
                            }
                            catch (HttpClientException exReserveReset)
                            {
                                if (exReserveReset.StatusCode != System.Net.HttpStatusCode.NotFound) throw;

                                _logger.LogError(exReserveReset, "Reservation reset failed for user with id '{userId}' and item with id '{itemId}' reserved on '{reservationDate}' with transaction id '{transactionId}' (log id '{logId}'). Assume reservation expired with '{httpStatus}'",
                                    user.Id, item.ItemId, item.DateCreated, item.TransactionId, item.Id, System.Net.HttpStatusCode.NotFound);
                            }

                            item.Status = TransactionStatus.Released;
                            item.StatusId = statusReleasedId;
                            _transactionLogRepository.Create(item).Wait();

                            break;

                        default:
                            throw;
                    }
                }
            }
        }
        #endregion
    }
}
