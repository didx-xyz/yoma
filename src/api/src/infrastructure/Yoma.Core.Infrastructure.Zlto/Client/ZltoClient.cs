using Flurl.Http;
using Yoma.Core.Domain.RewardsProvider.Interfaces;
using Yoma.Core.Infrastructure.Zlto.Models;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Zlto.Client
{
    public class ZltoClient : IRewardsProviderClient
    {
        #region Class Variables
        private readonly ZltoOptions _options;
        private OAuthResponse _accessToken;

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
        #endregion

        #region Private Members
        private async Task<KeyValuePair<string, string>> GetAuthHeaders(string countryCode)
        {
            if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.Now)
                return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");

            var account = _options.Accounts.SingleOrDefault(o => string.Equals(o.CountryCodeAlpha2, countryCode, StringComparison.InvariantCultureIgnoreCase)); //explicitly specified
            if (account == null) //default to global
            {
                countryCode = Country.Worldwide.ToDescription();
                account = _options.Accounts.SingleOrDefault(o => string.Equals(o.CountryCodeAlpha2, Country.Worldwide.ToDescription(), StringComparison.InvariantCultureIgnoreCase));
            }

            if (account == null)
                throw new ArgumentException($"Failed to retrieve account options for country code '{countryCode}'", nameof(countryCode));

            var data = new Dictionary<string, string>
            {
                { "client_id", account.ClientId },
                { "client_secret", account.ClientSecret },
                { "grant_type", "client_credentials"},
                { "audience", account.Audience }
            };

            _accessToken = await _options.AuthUrl
               .PostJsonAsync(data)
               .EnsureSuccessStatusCodeAsync()
               .ReceiveJson<OAuthResponse>();

            return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");
        }
        #endregion
    }
}
