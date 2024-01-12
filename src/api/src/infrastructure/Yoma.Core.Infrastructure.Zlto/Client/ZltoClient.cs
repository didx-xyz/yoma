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
            var existing = await GetWalletByUsername(request.Email);
            if (existing != null)
            {
                return (new Domain.Reward.Models.Wallet
                {
                    Id = existing.WalletId,
                    OwnerId = Guid.Parse(existing.OwnerId),
                    Balance = existing.ZltoBalance,
                    DateCreated = existing.DateCreated,
                    DateModified = existing.LastUpdated
                }, WalletCreationStatus.Existing);
            }

            //attempt legacy migration with initial balance
            var status = WalletCreationStatus.CreatedWithBalance;
            var account = await CreateAccountLegacy(request);

            var result = new Domain.Reward.Models.Wallet { Balance = request.Balance };

            //not a legacy user, create new account without initial balance
            if (account == null)
            {
                account = await CreateAccount(request);
                result.Balance = default;
                status = WalletCreationStatus.Created;
            }

            result.Id = account.WalletId;
            result.OwnerId = Guid.Parse(account.OwnerId);
            result.DateCreated = account.DateCreated;
            result.DateModified = account.LastUpdated;
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
                OwnerId = Guid.Parse(response.OwnerId),
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
             //TODO: filter on state
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
                    : throw new InvalidOperationException($"{nameof(o.ZltoAmount)} of '{o.ZltoAmount}' couldn't be parsed to an integer")
            }).OrderBy(o => o.Name).ToList();

            return results;

        }
        #endregion IRewardProviderClient 

        #region IMarketplaceProviderClient
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
                ImageURL = o.StoreLogo
            }).OrderBy(o => o.Name).ToList();
        }

        public async Task<List<Domain.Marketplace.Models.StoreItemCategory>> ListStoreItemCategories(string storeId)
        {
            if (string.IsNullOrWhiteSpace(storeId))
                throw new ArgumentNullException(nameof(storeId));
            storeId = storeId.Trim();

            var response = await _options.Store.BaseUrl
              .AppendPathSegment("all_item_categories_by_store_store_id/") //TODO: known issue; requires '/' suffix before query params
              .SetQueryParam("store_id", storeId)
              .SetQueryParam("item_state", (int)ItemState.Active)
              .WithAuthHeaders(await GetAuthHeaders())
              .PostAsync()
              .EnsureSuccessStatusCodeAsync()
              .ReceiveJson<StoreResponseItemCategories>();

            var results = response.Items.Select(o => new Domain.Marketplace.Models.StoreItemCategory
            {
                Id = o.ItemCategoryId,
                StoreId = o.StoreId,
                Name = o.ItemCatName,
                Description = o.ItemCatDescription,
                Summary = o.ItemCatDetails,
                ImageURL = o.ItemCatImage,
                ItemCount = o.StoreItemCount,
                Amount = o.ItemCatZlto

            }).OrderBy(o => o.Name).ToList();

            return results;
        }

        public async Task<List<Domain.Marketplace.Models.StoreItem>> ListStoreItems(string storeId, int itemCategoryId, int? limit, int? offset)
        {
            if (string.IsNullOrWhiteSpace(storeId))
                throw new ArgumentNullException(nameof(storeId));
            storeId = storeId.Trim();

            if (itemCategoryId <= default(int))
                throw new ArgumentNullException(nameof(itemCategoryId));

            var query = _options.Store.BaseUrl
                .AppendPathSegment("all_store_items_by_store_by_category")
                .SetQueryParam("store_id", storeId)
                .SetQueryParam("category_id", itemCategoryId)
                .SetQueryParam("item_state", (int)ItemState.Active)
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
                Id = o.ItemId,
                Name = o.ItemName,
                Description = o.ItemDescription,
                Summary = o.ItemDetails,
                Code = o.ItemCode,
                ImageURL = string.Equals(o.ItemLogo, "Default", StringComparison.InvariantCultureIgnoreCase) ? o.StoreInfoSi.StoreLogo : o.ItemLogo,
                Amount = o.ItemZlto

            }).OrderBy(o => o.Name).ToList();
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
            if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.Now)
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
                DateExpire = DateTimeOffset.Now.AddHours(_options.PartnerTokenExpirationIntervalInHours)
            };

            return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {response.AccessToken}");
        }

        private async Task<WalletAccountInfo?> CreateAccountLegacy(Domain.Reward.Models.Provider.WalletRequestCreate request)
        {
            var requestAccount = new WalletRequestCreateLegacy
            {
                OwnerOrigin = _accessToken.PartnerName,
                OwnerName = request.DisplayName,
                UserName = request.Email,
                Balance = (int)request.Balance
                //OwnerId: system assigned; can not be specified
                //UserPassword: used with external wallet activation; with Yoma wallets are internal
            };

            //TODO: with a failed legacy migration, is the status code NotFound OR Ok with a legacy response message, resulting in no account info returned. Example:
            //{ "legacy_response": "User someuser@gmail.com does not exist in Yoma Legacy Table", "msg": "wallet and account was not created" }

            WalletResponseCreateLegacy? response = null;
            try
            {
                response = await _options.Wallet.BaseUrl
                    .AppendPathSegment("create_legacy_account_for_external_partner")
                    .WithAuthHeaders(await GetAuthHeaders())
                    .PostJsonAsync(requestAccount)
                    .EnsureSuccessStatusCodeAsync()
                    .ReceiveJson<WalletResponseCreateLegacy>();
            }
            catch (HttpClientException ex)
            {
                if (ex.StatusCode != HttpStatusCode.NotFound) throw;
            }

            if (response?.LegacyResponse != null) return null;

            return response?.Wallet?.AccountInfo;
        }

        private async Task<WalletAccountInfo> CreateAccount(Domain.Reward.Models.Provider.WalletRequestCreate user)
        {
            var requestAccount = new Models.WalletRequestCreate
            {
                OwnerOrigin = _accessToken.PartnerName,
                OwnerName = user.DisplayName,
                UserName = user.Email,
                //OwnerId: system assigned; can not be specified
                //UserPassword: used with external wallet activation; with Yoma wallets are internal
            };

            //TODO: Results in an internal server error
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
                    .AppendPathSegment("get_wallet_details_by_account_username/") //TODO: known issue; requires '/' suffix before query params
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
                    return new Domain.Marketplace.Models.StoreCategory
                    {
                        Id = firstItem.Category.Id,
                        Name = firstItem.Category.CategoryName
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
             .AppendPathSegment("get_only_country_store_fronts_by_yoma")
             .WithAuthHeaders(await GetAuthHeaders());

            if (string.IsNullOrWhiteSpace(countryCodeAlpha2))
                throw new ArgumentNullException(nameof(countryCodeAlpha2));
            countryCodeAlpha2 = countryCodeAlpha2.Trim();

            var countryOwner = _options.Store.Owners.SingleOrDefault(o => string.Equals(o.CountryCodeAlpha2, countryCodeAlpha2, StringComparison.InvariantCultureIgnoreCase));

            var countryOwnerId = countryOwner?.Id ?? _options.Store.Owners
                .Single(o => string.Equals(o.CountryCodeAlpha2, Country.Worldwide.ToDescription(), StringComparison.InvariantCultureIgnoreCase)).Id;
            query = query.SetQueryParam("country_owner_id", countryOwnerId);

            //TODO: pagination does not work correctly
            if (limit.HasValue && limit.Value > default(int))
                query = query.SetQueryParam("limit", limit - 1);

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
