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
    public Task<string> CreateOpportunity(Opportunity opportunity)
    {
      throw new NotImplementedException();
    }

    public Task UpdateOpportunity(string externalId, Opportunity opportunity)
    {
      throw new NotImplementedException();
    }

    public Task DeleteOpportunity(string externalId)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
