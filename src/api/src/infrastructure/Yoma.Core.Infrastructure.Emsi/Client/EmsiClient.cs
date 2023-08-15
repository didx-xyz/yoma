using Flurl.Http;
using Yoma.Core.Infrastructure.Emsi.Models;
using Yoma.Core.Domain.Core.Extensions;
using Flurl;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Domain.LaborMarketProvider.Models;

namespace Yoma.Core.Infrastructure.Emsi.Client
{
  public class EmsiClient : ILaborMarketProviderClient
  {
    #region Class Variables
    private readonly EmsiOptions _options;
    private OAuthResponse _accessToken;

    private const string Header_Authorization = "Authorization";
    private const string Header_Authorization_Value_Prefix = "Bearer";
    #endregion

    #region Constructor
    public EmsiClient(EmsiOptions options)
    {
      _options = options;
    }
    #endregion

    #region Public Members
    public async Task<List<Domain.LaborMarketProvider.Models.Skill>?> ListSkills()
    {
      var resp = await _options.BaseUrl
         .AppendPathSegment($"/skills/versions/latest/skills")
         .WithAuthHeaders(await GetAuthHeaders(AuthScope.Skills))
         .GetAsync()
         .EnsureSuccessStatusCodeAsync();

      var results = await resp.GetJsonAsync<SkillResponse>();

      return results?.Data.Select(o => new Domain.LaborMarketProvider.Models.Skill { Id = o.Id, Name = o.Name, InfoURL = o.InfoUrl }).ToList();
    }

    public async Task<List<JobTitle>?> ListJobTitles()
    {
      var resp = await _options.BaseUrl
         .AppendPathSegment($"/titles/versions/latest/titles")
         .WithAuthHeaders(await GetAuthHeaders(AuthScope.Jobs))
         .GetAsync()
         .EnsureSuccessStatusCodeAsync();

      var results = await resp.GetJsonAsync<TitleResponse>();

      return results?.Data?.Select(o => new JobTitle { Id = o.Id, Name = o.Name }).ToList();
    }
    #endregion

    #region Private Members
    private async Task<KeyValuePair<string, string>> GetAuthHeaders(AuthScope scope)
    {
      if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.Now)
        return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");

      var data = new Dictionary<string, string>
            {
                { "client_id", _options.ClientId },
                {"client_secret", _options.ClientSecret },
                { "grant_type", "client_credentials"},
                {"scope", scope.ToDescription() }
            };

      _accessToken = await _options.AuthUrl
         .PostUrlEncodedAsync(data)
         .EnsureSuccessStatusCodeAsync()
         .ReceiveJson<OAuthResponse>();

      return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");
    }
    #endregion
  }
}
