using Flurl.Http;
using Yoma.Core.Infrastructure.Emsi.Models;
using Yoma.Core.Domain.Core.Extensions;
using Flurl;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Domain.LaborMarketProvider.Models;
using Yoma.Core.Domain.Core.Helpers;
using Newtonsoft.Json;
using System.Reflection;
using System.Text;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Yoma.Core.Infrastructure.Emsi.Client
{
    public class EmsiClient : ILaborMarketProviderClient
    {
        #region Class Variables
        private readonly ILogger<EmsiClient> _logger;
        private readonly IEnvironmentProvider _environmentProvider;
        private readonly AppSettings _appSettings;
        private readonly EmsiOptions _options;
        private static OAuthResponse _accessToken;

        private const string Header_Authorization = "Authorization";
        private const string Header_Authorization_Value_Prefix = "Bearer";
        #endregion

        #region Constructor
        public EmsiClient(ILogger<EmsiClient> logger,
            IEnvironmentProvider environmentProvider,
            AppSettings appSettings,
            EmsiOptions options)
        {
            _logger = logger;
            _environmentProvider = environmentProvider;
            _appSettings = appSettings;
            _options = options;
        }
        #endregion

        #region Public Members

        public async Task<List<Domain.LaborMarketProvider.Models.Skill>?> ListSkills()
        {
            if (!_appSettings.LaborMarketProviderAsSourceEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
            {
                _logger.LogInformation("Used local embedded EMSI skills payload for environment '{environment}'", _environmentProvider.Environment);
                return ParsePayloadLocalSkills();
            }

            var resp = await _options.BaseUrl
               .AppendPathSegment($"/skills/versions/latest/skills")
               .WithAuthHeader(await GetAuthHeader(AuthScope.Skills))
               .GetAsync()
               .EnsureSuccessStatusCodeAsync();

            var results = await resp.GetJsonAsync<SkillResponse>();

            return results?.Data.Select(o => new Domain.LaborMarketProvider.Models.Skill { Id = o.Id, Name = o.Name, InfoURL = o.InfoUrl }).ToList();
        }

        public async Task<List<JobTitle>?> ListJobTitles()
        {
            var resp = await _options.BaseUrl
               .AppendPathSegment($"/titles/versions/latest/titles")
               .WithAuthHeader(await GetAuthHeader(AuthScope.Jobs))
               .GetAsync()
               .EnsureSuccessStatusCodeAsync();

            var results = await resp.GetJsonAsync<TitleResponse>();

            return results?.Data?.Select(o => new JobTitle { Id = o.Id, Name = o.Name }).ToList();
        }
        #endregion

        #region Private Members
        private async Task<KeyValuePair<string, string>> GetAuthHeader(AuthScope scope)
        {
            if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.UtcNow)
                return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");

            var data = new Dictionary<string, string>
            {
                { "client_id", _options.ClientId },
                { "client_secret", _options.ClientSecret },
                { "grant_type", "client_credentials"},
                { "scope", scope.ToDescription() }
            };

            _accessToken = await _options.AuthUrl
               .PostUrlEncodedAsync(data)
               .EnsureSuccessStatusCodeAsync()
               .ReceiveJson<OAuthResponse>();

            return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");
        }

        private static List<Domain.LaborMarketProvider.Models.Skill> ParsePayloadLocalSkills()
        {
            var resourcePath = "Yoma.Core.Infrastructure.Emsi.payload_local_skills.json";
            var assembly = Assembly.GetExecutingAssembly();
            using var resourceStream = assembly.GetManifestResourceStream(resourcePath)
                ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found");

            string jsonContent;
            using (var reader = new StreamReader(resourceStream, Encoding.UTF8))
            {
                jsonContent = reader.ReadToEnd();
            }

            var result = JsonConvert.DeserializeObject<List<Domain.LaborMarketProvider.Models.Skill>>(jsonContent);
            if (result == null || result.Count == 0)
                throw new InvalidOperationException($"Embedded resource '{resourcePath}' could not be deserialized or contains no data");

            result.ForEach(o => o.Id = HashHelper.ComputeSHA256Hash(o.Name));

            return result;
        }
        #endregion
    }
}
