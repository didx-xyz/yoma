using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth.Client
{
  public class SAYouthClient : ISharingProviderClient
  {
    #region Class Variables
    private readonly ILogger<SAYouthClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly SAYouthOptions _options;

    private const string Header_Api_Version = "X-API-VERSION";
    private const string Header_Authorization = "X-API-KEY";
    #endregion

    #region Constructor
    public SAYouthClient(ILogger<SAYouthClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      SAYouthOptions options)
    {
      _logger = logger;
      _environmentProvider = environmentProvider;
      _appSettings = appSettings;
      _options = options;
    }
    #endregion

    #region Public Members
    public async Task<string> CreateOpportunity(Opportunity opportunity)
    {
      return await Task.FromResult(Guid.NewGuid().ToString()); //TODO: Implement
    }

    public async Task UpdateOpportunity(string externalId, Opportunity opportunity)
    {
      await Task.CompletedTask; //TODO: Implement
    }

    public async Task DeleteOpportunity(string externalId)
    {
      await Task.CompletedTask; //TODO: Implement
    }
    #endregion

    #region Private Members
    private Dictionary<string, string> GetAuthHeaders()
    {
      return new Dictionary<string, string>
      {
        { Header_Api_Version, _options.ApiVersion },
        { Header_Authorization, _options.ApiKey  }
      };
    }
    #endregion
  }
}
