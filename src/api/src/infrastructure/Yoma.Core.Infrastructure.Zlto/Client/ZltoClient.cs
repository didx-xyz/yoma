using Flurl;
using Flurl.Http;
using Yoma.Core.Domain.RewardsProvider.Interfaces;
using Yoma.Core.Infrastructure.Zlto.Models;
using Yoma.Core.Domain.RewardsProvider.Models;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Infrastructure.Zlto.Client
{
    public class ZltoClient : IRewardsProviderClient
    {
        #region Class Variables
        private readonly ZltoOptions _options;
        private AuthResponse _accessToken;

        private const string Header_Authorization = "Authorization";
        private const string Header_Authorization_Value_Prefix = "Bearer";
        #endregion

        #region Constructor
        public ZltoClient(ZltoOptions options)
        {
            _options = options;
        }
        #endregion

        #region Public Members
        public async Task<Domain.RewardsProvider.Models.Wallet> EnsureWallet(WalletRequestCreate user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            //check of wallet exists
            var result = await GetWalletByUsername(user.Email);
            if (result != null)
                return new Domain.RewardsProvider.Models.Wallet
                {
                    Id = result.WalletId,
                    OwnerId = Guid.Parse(result.OwnerId),
                    DateCreated = result.DateCreated,
                    DateModified = result.LastUpdated
                };

            //attempt legacy migration
            var account = await CreateAccountLegacy(user);

            //not a legacy user, create new account with wallet
            account ??= await CreateAccount(user);

            return new Domain.RewardsProvider.Models.Wallet
            {
                Id = account.WalletId,
                OwnerId = Guid.Parse(account.OwnerId),
                DateCreated = account.DateCreated,
                DateModified = account.LastUpdated
            };
        }

        public async Task<decimal> GetBalance(string walletId)
        {
            if (string.IsNullOrWhiteSpace(walletId))
                throw new ArgumentNullException(nameof(walletId));
            walletId = walletId.Trim();

            var httpResponse = await _options.Wallet.BaseUrl
                 .AppendPathSegment("get_wallet_balance")
                 .WithAuthHeaders(await GetAuthHeaders())
                 .AppendPathSegment(walletId)
                 .GetAsync()
                 .EnsureSuccessStatusCodeAsync();

            var response = await httpResponse.GetJsonAsync<WalletResponseBalance>();
            return response.ZltoBalance;
        }

        public async Task<List<Transaction>?> ListTransactions(WalletSearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            var query = _options.Wallet.BaseUrl
             .AppendPathSegment("get_transactions_by_wallet")
             .WithAuthHeaders(await GetAuthHeaders())
             .AppendPathSegment(filter.WalletId);

            if (filter.PaginationEnabled)
            {
                if (!filter.PageNumber.HasValue || filter.PageNumber.Value <= default(int))
                    throw new ArgumentNullException(nameof(filter), $"{nameof(filter.PageNumber)} required");

                if (!filter.PageSize.HasValue || filter.PageSize.Value <= default(int))
                    throw new ArgumentNullException(nameof(filter.PageSize), $"{nameof(filter.PageSize)} required");

                query = query.AppendPathSegment(filter.PageSize);
                query = query.AppendPathSegment(filter.PageNumber);
            }

            var httpResponse = await query.GetAsync()
                .EnsureSuccessStatusCodeAsync();

            var response = await httpResponse.GetJsonAsync<WalletResponseTransactions>();

            return response.Items?.Select(o => new Transaction
            {
                Id = o.Transaction_id,
                Description = o.Transaction_payload,
                Amount = o.Transaction_amount,
                DateCreated = o.Date_created,
                DateModified = o.Last_updated
            }).ToList();
        }
        #endregion

        #region Private Members
        private async Task<KeyValuePair<string, string>> GetAuthHeaders()
        {
            if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.Now)
                return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.AccessToken}");

            var request = new PartnerRequestLogin
            {
                PartnerUsername = _options.Username,
                PartnerPassword = _options.Password
            };

            var response = await _options.Partner.BaseUrl
               .AppendPathSegment("external_partner_login")
               .WithAuthHeaders(await GetAuthHeaders())
               .PostJsonAsync(request)
               .EnsureSuccessStatusCodeAsync()
               .ReceiveJson<PartnerResponseLogin>();

            if (response.AccountInfo.PartnerStatus == PartnerAccountStatus.Ban)
                throw new InvalidOperationException("Account has been banned");

            _accessToken = new AuthResponse
            {
                AccessToken = response.AccessToken,
                PartnerId = response.AccountInfo.PartnerId,
                PartnerName = response.AccountInfo.PartnerName
            };

            return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {response.AccessToken}");
        }

        private async Task<AccountInfo> CreateAccount(WalletRequestCreate user)
        {
            var requestAccount = new AccountRequestCreate
            {
                OwnerId = user.Id.ToString(),
                OwnerOrigin = _accessToken.PartnerName,
                OwnerName = user.DisplayName,
                UserName = user.Email,
                UserPassword = string.Empty
            };

            var response = await _options.Wallet.BaseUrl
                .AppendPathSegment("create_account_for_external_partner")
                .WithAuthHeaders(await GetAuthHeaders())
                .PostJsonAsync(requestAccount)
                .EnsureSuccessStatusCodeAsync()
                .ReceiveJson<AccountResponseCreate>();

            return response.AccountInfo;
        }

        private async Task<AccountInfo?> CreateAccountLegacy(WalletRequestCreate user)
        {
            var requestAccount = new AccountRequestCreate
            {
                OwnerId = user.Id.ToString(),
                OwnerOrigin = _accessToken.PartnerName,
                OwnerName = user.DisplayName,
                UserName = user.Email,
                UserPassword = string.Empty
            };

            var response = await _options.Wallet.BaseUrl
                .AppendPathSegment("create_legacy_account_for_external_partner")
                .WithAuthHeaders(await GetAuthHeaders())
                .PostJsonAsync(requestAccount)
                .EnsureSuccessStatusCodeAsync()
                .ReceiveJson<AccountResponseCreateLegacy>();

            return response.Wallet_response?.AccountInfo;
        }

        private async Task<WalletResponseGet?> GetWalletByUsername(string username)
        {
            //check if wallet exist
            try
            {
                var response = await _options.Wallet.BaseUrl
                    .AppendPathSegment("get_wallet_details_by_account_username")
                    .AppendPathSegment(username)
                    .WithAuthHeaders(await GetAuthHeaders())
                    .GetAsync()
                    .EnsureSuccessStatusCodeAsync();

                return await response.GetJsonAsync<WalletResponseGet>();
            }
            catch (HttpClientException ex)
            {
                if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
            }

            return null;
        }
        #endregion
    }
}
