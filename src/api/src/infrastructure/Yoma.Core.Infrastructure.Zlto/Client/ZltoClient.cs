using Flurl;
using Flurl.Http;
using Yoma.Core.Infrastructure.Zlto.Models;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Marketplace.Models;
using Microsoft.Extensions.Caching.Memory;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core;
using System.Net;
using Yoma.Core.Domain.Marketplace.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models.Provider;

namespace Yoma.Core.Infrastructure.Zlto.Client
{
    public class ZltoClient : IRewardProviderClient, IMarketplaceProviderClient
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ZltoOptions _options;
        private readonly IMemoryCache _memoryCache;
        private static AuthResponse _accessToken;

        private const string Header_Authorization = "Authorization";
        private const string Header_Authorization_Value_Prefix = "Bearer";
        private const string Image_Default_Empty_Value = "default";
        #endregion

        #region Constructor
        public ZltoClient(AppSettings appSettings, ZltoOptions options,
            IMemoryCache memoryCache)
        {
            _appSettings = appSettings;
            _options = options;
            _memoryCache = memoryCache;
        }
        #endregion

        #region Public Members
        #region IRewardProviderClient
        public async Task<(Domain.Reward.Models.Wallet wallet, WalletCreationStatus status)> CreateWallet(Domain.Reward.Models.Provider.WalletRequestCreate request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            //check if wallet already exists
            var existing = await GetWalletByUsername(request.Username);
            if (existing != null)
            {
                return (new Domain.Reward.Models.Wallet
                {
                    Id = existing.WalletId,
                    OwnerId = existing.OwnerId,
                    Balance = existing.ZltoBalance,
                    DateCreated = existing.DateCreated,
                    DateModified = existing.LastUpdated
                }, WalletCreationStatus.Existing);
            }

            //attempt legacy migration with initial balance
            var status = WalletCreationStatus.Created;
            var account = await CreateAccount(request);

            var result = new Domain.Reward.Models.Wallet
            {
                Balance = request.Balance,
                Id = account.WalletId,
                OwnerId = account.OwnerId,
                DateCreated = account.DateCreated,
                DateModified = account.LastUpdated
            };
            return (result, status);
        }

        public async Task<Domain.Reward.Models.Wallet> GetWallet(string walletId)
        {
            if (string.IsNullOrWhiteSpace(walletId))
                throw new ArgumentNullException(nameof(walletId));
            walletId = walletId.Trim();

            var httpResponse = await _options.Wallet.BaseUrl
                 .AppendPathSegment("get_wallet_details")
                 .AppendPathSegment(walletId)
                 .WithAuthHeaders(await GetAuthHeaders())
                 .GetAsync()
                 .EnsureSuccessStatusCodeAsync();

            var response = await httpResponse.GetJsonAsync<WalletResponse>();

            return new Domain.Reward.Models.Wallet
            {
                Id = response.WalletId,
                OwnerId = response.OwnerId,
                Balance = response.ZltoBalance,
                DateCreated = response.DateCreated,
                DateModified = response.LastUpdated
            };
        }

        public async Task<List<Domain.Reward.Models.WalletVoucher>> ListWalletVouchers(string walletId, int? limit, int? offset)
        {
            if (string.IsNullOrWhiteSpace(walletId))
                throw new ArgumentNullException(nameof(walletId));
            walletId = walletId.Trim();

            var query = _options.Wallet.BaseUrl
             .AppendPathSegment("get_vouchers_by_wallet")
             .SetQueryParam("wallet_id", walletId)
             .WithAuthHeaders(await GetAuthHeaders());

            if (limit.HasValue && limit.Value > default(int))
                query = query.SetQueryParam("limit", limit);

            if (offset.HasValue && offset.Value >= default(int))
                query = query.SetQueryParam("offset", offset);

            var response = await query.PostAsync()
                .EnsureSuccessStatusCodeAsync()
                .ReceiveJson<WalletResponseSearchVouchers>();

            var results = response.Items.Select(o => new Domain.Reward.Models.WalletVoucher
            {
                Id = o.VoucherId,
                Category = o.VoucherCategory,
                Name = o.VoucherName,
                Code = o.VoucherCode,
                Instructions = o.VoucherInstructions,
                Amount = int.TryParse(o.ZltoAmount, out int parsedAmount)
                    ? parsedAmount
                    : throw new InvalidOperationException($"{nameof(o.ZltoAmount)} of '{o.ZltoAmount}' couldn't be parsed to an integer"),
                Status = Enum.Parse<Domain.Reward.VoucherStatus>(o.VoucherState, true),
            }).OrderBy(o => o.Name).ToList();

            return results;

        }

        public async Task<string> RewardEarn(RewardAwardRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var httpRequest = new RewardEarnRequest
            {
                TaskTitle = request.Title,
                TaskOrigin = "Yoma",
                TaskType = request.Type.ToString(),
                TaskDescription = request.Description,
                TaskInstructions = string.IsNullOrEmpty(request.Instructions) ? "n/a" : request.Instructions,
                TaskExternalId = request.Id.ToString(),
                TaskProgramId = "n/a",
                BankTransactionId = "n/a",
                UserName = request.Username,
                TaskSkills = (request.Skills != null && request.Skills.Any()) ? string.Join(",", request.Skills.Select(o => o.Name)) : "n/a",
                TaskCountry = (request.Countries != null && request.Countries.Any()) ? string.Join(",", request.Countries.Select(o => o.Name)) : "n/a",
                TaskLanguage = (request.Languages != null && request.Languages.Any()) ? string.Join(",", request.Languages.Select(o => o.Name)) : "n/a",
                TaskPeopleImpacted = 1,
                TaskTimeInvestedHours = request.TimeInvestedInHours,
                TaskExternalUrl = string.IsNullOrEmpty(request.ExternalURL) ? "n/a" : request.ExternalURL,
                TaskExternalProof = "n/a",
                TaskNeedsReview = 0,
                TaskStatus = (int)RewardEarnTaskStatus.Completed,
                TaskStartTime = request.StartDate.HasValue ? request.StartDate.Value.ToLocalTime().ToString() : "n/a",
                TaskEndTime = request.EndDate.HasValue ? request.EndDate.Value.ToLocalTime().ToString() : "n/a",
                ZltoWalletId = request.UserWalletId,
                TaskZltoReward = (int)request.Amount
            };

            var httpResponse = await _options.Task.BaseUrl
               .AppendPathSegment("external_program_task_transaction")
               .WithAuthHeaders(await GetAuthHeaders())
               .PostJsonAsync(httpRequest)
               .EnsureSuccessStatusCodeAsync()
               .ReceiveJson<RewardEarnResponse>();

            var result = httpResponse.TaskResponse.TaskId;
            return result;
        }

        #endregion IRewardProviderClient 

        #region IMarketplaceProviderClient
        public List<string> ListSupportedCountryCodesAlpha2(string? countryCodeAlpha2)
        {
            countryCodeAlpha2 = countryCodeAlpha2?.Trim();

            var results = new List<string>() { Country.Worldwide.ToDescription() };

            var supportedCountryCodesAlpha2 = _options.Store.Owners
                .Where(o => string.IsNullOrEmpty(countryCodeAlpha2) || string.Equals(countryCodeAlpha2, o.CountryCodeAlpha2, StringComparison.InvariantCultureIgnoreCase))
                .Select(o => o.CountryCodeAlpha2).ToList();

            results = results.Union(supportedCountryCodesAlpha2).ToList();

            return results;
        }

        public async Task<List<Domain.Marketplace.Models.StoreCategory>> ListStoreCategories(string? countryCodeAlpha2)
        {
            countryCodeAlpha2 = ResolveCountryCode(countryCodeAlpha2);

            if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
                return await ListStoreCategoriesInternal(countryCodeAlpha2);

            var result = await _memoryCache.GetOrCreateAsync($"{nameof(Domain.Marketplace.Models.StoreCategory)}|{countryCodeAlpha2}", async entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return await ListStoreCategoriesInternal(countryCodeAlpha2);
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Domain.Marketplace.Models.StoreCategory)}s'");

            return result;
        }

        public async Task<List<Domain.Marketplace.Models.Store>> ListStores(string? countryCodeAlpha2, string? categoryId, int? limit, int? offset)
        {
            var response = await ListStoresInternal(ResolveCountryCode(countryCodeAlpha2), categoryId, limit, offset);

            var result = new StoreSearchResults { Items = new List<Domain.Marketplace.Models.Store>() };

            return response.Items.Select(o => new Domain.Marketplace.Models.Store
            {
                Id = o.StoreId,
                Name = o.StoreName,
                Description = o.StoreDescription,
                ImageURL = string.Equals(o.StoreLogo, Image_Default_Empty_Value, StringComparison.InvariantCultureIgnoreCase) ? null : o.StoreLogo
            }).OrderBy(o => o.Name).ToList();
        }

        public async Task<List<Domain.Marketplace.Models.StoreItemCategory>> ListStoreItemCategories(string storeId, int? limit, int? offset)
        {
            if (string.IsNullOrWhiteSpace(storeId))
                throw new ArgumentNullException(nameof(storeId));
            storeId = storeId.Trim();

            var query = _options.Store.BaseUrl
              .AppendPathSegment("all_item_categories_by_store_store_id")
              .SetQueryParam("store_id", storeId)
              .SetQueryParam("item_state", (int)StoreItemCategoryState.Active)
              .WithAuthHeaders(await GetAuthHeaders());

            if (limit.HasValue && limit.Value > default(int))
                query = query.SetQueryParam("limit", limit);

            if (offset.HasValue && offset.Value >= default(int))
                query = query.SetQueryParam("offset", offset);

            var response = await query.PostAsync()
              .EnsureSuccessStatusCodeAsync()
              .ReceiveJson<StoreResponseItemCategories>();

            var results = response.Items.Select(o => new Domain.Marketplace.Models.StoreItemCategory
            {
                Id = o.ItemCategoryId.ToString(),
                StoreId = o.StoreId,
                Name = o.ItemCatName,
                Description = o.ItemCatDescription,
                Summary = o.ItemCatDetails,
                ImageURL = string.Equals(o.ItemCatImage, Image_Default_Empty_Value, StringComparison.InvariantCultureIgnoreCase) ? null : o.ItemCatImage,
                //o.StoreItemCount: internal count the does not reflect the available item count correctly
                Count = ListStoreItems(storeId, o.ItemCategoryId.ToString(), null, null).Result.Count,
                Amount = o.ItemCatZlto

            }).OrderBy(o => o.Name).ToList();

            return results;
        }

        public async Task<List<Domain.Marketplace.Models.StoreItem>> ListStoreItems(string storeId, string itemCategoryId, int? limit, int? offset)
        {
            if (string.IsNullOrWhiteSpace(storeId))
                throw new ArgumentNullException(nameof(storeId));
            storeId = storeId.Trim();

            if (string.IsNullOrWhiteSpace(itemCategoryId))
                throw new ArgumentNullException(nameof(itemCategoryId));
            itemCategoryId = itemCategoryId.Trim();

            var query = _options.Store.BaseUrl
                .AppendPathSegment("all_store_items_by_store_by_category")
                .SetQueryParam("store_id", storeId)
                .SetQueryParam("category_id", itemCategoryId)
                .SetQueryParam("item_state", (int)StoreItemState.Available)
                .WithAuthHeaders(await GetAuthHeaders());

            if (limit.HasValue && limit.Value > default(int))
                query = query.SetQueryParam("limit", limit);

            if (offset.HasValue && offset.Value >= default(int))
                query = query.SetQueryParam("offset", offset);

            var httpResponse = await query.GetAsync()
                .EnsureSuccessStatusCodeAsync();

            var response = await httpResponse.GetJsonAsync<StoreResponseSearchItem>();

            return response.Items.Select(o => new Domain.Marketplace.Models.StoreItem
            {
                Id = o.ItemId.ToString(),
                Name = o.ItemName,
                Description = o.ItemDescription,
                Summary = o.ItemDetails,
                Code = o.ItemCode,
                ImageURL = string.Equals(o.ItemLogo, Image_Default_Empty_Value, StringComparison.InvariantCultureIgnoreCase) ? o.StoreInfoSi.StoreLogo
                : string.Equals(o.ItemLogo, Image_Default_Empty_Value, StringComparison.InvariantCultureIgnoreCase) ? null : o.ItemLogo,
                Amount = o.ItemZlto

            }).OrderBy(o => o.Name).ToList();
        }

        public async Task<string> ItemReserve(string walletId, string username, string itemId)
        {
            if (string.IsNullOrWhiteSpace(walletId))
                throw new ArgumentNullException(nameof(walletId));
            walletId = walletId.Trim();

            if (string.IsNullOrWhiteSpace(username))
                throw new ArgumentNullException(nameof(username));
            username = username.Trim();

            if (string.IsNullOrWhiteSpace(itemId))
                throw new ArgumentNullException(nameof(itemId));
            itemId = itemId.Trim();

            var wallet = await GetWallet(walletId);

            var request = new ItemActionRequest
            {
                Username = username,
                WalletOwnerId = wallet.OwnerId
            };

            var response = await _options.Store.BaseUrl
              .AppendPathSegment("update_item_reserve_external_partner")
              .AppendPathSegment(itemId)
              .WithAuthHeaders(await GetAuthHeaders())
              .PutJsonAsync(request)
              .EnsureSuccessStatusCodeAsync()
              .ReceiveJson<ReserveItemResponse>();

            if (response.BankResponse == null)
                throw new HttpClientException(HttpStatusCode.InternalServerError, $"Item reservation failed: {(string.IsNullOrWhiteSpace(response.Message) ? "no info" : response.Message)}");

            return response.BankResponse.TransactionInfo.TransactionId.ToString();
        }

        public async System.Threading.Tasks.Task ItemReserveReset(string itemId, string transactionId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
                throw new ArgumentNullException(nameof(itemId));
            itemId = itemId.Trim();

            if (string.IsNullOrWhiteSpace(transactionId))
                throw new ArgumentNullException(nameof(transactionId));
            transactionId = transactionId.Trim();

            await _options.Store.BaseUrl
              .AppendPathSegment("update_item_reset")
              .AppendPathSegment(itemId)
              .AppendPathSegment(transactionId)
              .WithAuthHeaders(await GetAuthHeaders())
              .PutAsync()
              .EnsureSuccessStatusCodeAsync();
        }

        public async System.Threading.Tasks.Task ItemSold(string walletId, string username, string itemId, string transactionId)
        {
            if (string.IsNullOrWhiteSpace(walletId))
                throw new ArgumentNullException(nameof(walletId));
            walletId = walletId.Trim();

            if (string.IsNullOrWhiteSpace(username))
                throw new ArgumentNullException(nameof(username));
            username = username.Trim();

            if (string.IsNullOrWhiteSpace(itemId))
                throw new ArgumentNullException(nameof(itemId));
            itemId = itemId.Trim();

            if (string.IsNullOrWhiteSpace(transactionId))
                throw new ArgumentNullException(nameof(transactionId));
            transactionId = transactionId.Trim();

            var wallet = await GetWallet(walletId);

            var request = new ItemActionRequest
            {
                Username = username,
                WalletOwnerId = wallet.OwnerId
            };

            await _options.Store.BaseUrl
              .AppendPathSegment("update_item_sold")
              .AppendPathSegment(itemId)
              .AppendPathSegment(transactionId)
              .WithAuthHeaders(await GetAuthHeaders())
              .PutJsonAsync(request)
              .EnsureSuccessStatusCodeAsync();
        }
        #endregion IMarketplaceProviderClient
        #endregion

        #region Private Members
        private async Task<Dictionary<string, string>> GetAuthHeaders()
        {
            var authHeaders = new Dictionary<string, string>(new[]
            {
                GetAuthHeaderApiKey(),
                await GetAuthHeaderToken()
            });

            return authHeaders;
        }

        private KeyValuePair<string, string> GetAuthHeaderApiKey()
        {
            return new KeyValuePair<string, string>(_options.ApiKeyHeaderName, _options.ApiKey);
        }

        private async Task<KeyValuePair<string, string>> GetAuthHeaderToken()
        {
            if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.UtcNow)
                return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.AccessToken}");

            var request = new PartnerRequestLogin
            {
                Username = _options.Username,
                Password = _options.Password
            };

            var response = await _options.Partner.BaseUrl
               .AppendPathSegment("external_partner_login")
               .WithHeaders(GetAuthHeaderApiKey())
               .PostJsonAsync(request)
               .EnsureSuccessStatusCodeAsync()
               .ReceiveJson<PartnerResponseLogin>();

            if (response.AccountInfo.PartnerStatus == PartnerAccountStatus.Ban)
                throw new InvalidOperationException("Account has been banned");

            _accessToken = new AuthResponse
            {
                AccessToken = response.AccessToken,
                PartnerId = response.AccountInfo.PartnerId,
                PartnerName = response.AccountInfo.PartnerName.ToLower(),
                DateExpire = DateTimeOffset.UtcNow.AddHours(_options.PartnerTokenExpirationIntervalInHours)
            };

            return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {response.AccessToken}");
        }

        private async Task<WalletAccountInfo> CreateAccount(Domain.Reward.Models.Provider.WalletRequestCreate request)
        {
            var requestAccount = new Models.WalletRequestCreate
            {
                OwnerOrigin = _accessToken.PartnerName,
                OwnerName = request.DisplayName,
                UserName = request.Username,
                Balance = (int)request.Balance
                //OwnerId: system assigned; can not be specified
                //UserPassword: used with external wallet activation; with Yoma wallets are internal
            };

            var response = await _options.Wallet.BaseUrl
                .AppendPathSegment("create_account_for_external_partner")
                .WithAuthHeaders(await GetAuthHeaders())
                .PostJsonAsync(requestAccount)
                .EnsureSuccessStatusCodeAsync()
                .ReceiveJson<WalletResponseCreate>();

            return response.AccountInfo;
        }

        private async Task<WalletResponse?> GetWalletByUsername(string username)
        {
            //check if wallet exist
            try
            {
                var response = await _options.Wallet.BaseUrl
                    .AppendPathSegment("get_wallet_details_by_account_username")
                    .SetQueryParam("wallet_username", username)
                    .WithAuthHeaders(await GetAuthHeaders())
                    .PostAsync()
                    .EnsureSuccessStatusCodeAsync()
                    .ReceiveJson<WalletResponse>();

                return response;
            }
            catch (HttpClientException ex)
            {
                if (ex.StatusCode != HttpStatusCode.NotFound) throw;
            }

            return null;
        }

        private async Task<List<Domain.Marketplace.Models.StoreCategory>> ListStoreCategoriesInternal(string CountryCodeAlpha2)
        {
            var resultSearch = await ListStoresInternal(CountryCodeAlpha2, null, null, null);

            var results = resultSearch?.Items
                ?.GroupBy(store => store.Category.Id)
                .Select(group =>
                {
                    var firstItem = group.First();
                    return firstItem == null
                        ? throw new InvalidOperationException("First item in group is null")
                        : new Domain.Marketplace.Models.StoreCategory
                        {
                            Id = firstItem.Category.Id,
                            Name = firstItem.Category.CategoryName,
                            StoreImageURLs = resultSearch?.Items
                            .Where(o => o.Category.Id == firstItem.Category.Id && o.StoreLogo != null && !string.Equals(o.StoreLogo, Image_Default_Empty_Value, StringComparison.InvariantCultureIgnoreCase))
                            .OrderBy(o => o.StoreName)
                            .Select(o => o.StoreLogo)
                            .Take(4)
                            .ToList() ?? new List<string>()
                        };
                })
                .OrderBy(o => o.Name).ToList() ?? new List<Domain.Marketplace.Models.StoreCategory>();

            return results;
        }

        private static string ResolveCountryCode(string? countryCodeAlpha2)
        {
            countryCodeAlpha2 = countryCodeAlpha2?.Trim();
            if (string.IsNullOrEmpty(countryCodeAlpha2))
                countryCodeAlpha2 = Country.Worldwide.ToDescription();

            return countryCodeAlpha2;
        }

        private async Task<StoreResponseSearch> ListStoresInternal(string countryCodeAlpha2, string? categoryId, int? limit, int? offset)
        {
            var query = _options.Store.BaseUrl
             .AppendPathSegment("get_public_and_country_store_fronts_by_yoma")
             .WithAuthHeaders(await GetAuthHeaders());

            if (string.IsNullOrWhiteSpace(countryCodeAlpha2))
                throw new ArgumentNullException(nameof(countryCodeAlpha2));
            countryCodeAlpha2 = countryCodeAlpha2.Trim();

            var countryOwner = _options.Store.Owners.SingleOrDefault(o => string.Equals(o.CountryCodeAlpha2, countryCodeAlpha2, StringComparison.InvariantCultureIgnoreCase));

            var countryOwnerId = countryOwner?.Id ?? _options.Store.Owners
                .Single(o => string.Equals(o.CountryCodeAlpha2, Country.Worldwide.ToDescription(), StringComparison.InvariantCultureIgnoreCase)).Id;
            query = query.SetQueryParam("country_owner_id", countryOwnerId);

            if (limit.HasValue && limit.Value > default(int))
                query = query.SetQueryParam("limit", limit);

            if (offset.HasValue && offset.Value >= default(int))
                query = query.SetQueryParam("offset", offset);

            var response = await query.PostAsync()
                .EnsureSuccessStatusCodeAsync()
                .ReceiveJson<StoreResponseSearch>();

            categoryId = categoryId?.Trim();
            if (!string.IsNullOrEmpty(categoryId))
                response.Items = response.Items.Where(o => string.Equals(o.Category.Id, categoryId, StringComparison.InvariantCultureIgnoreCase)).ToList();

            return response;
        }
        #endregion
    }
}
