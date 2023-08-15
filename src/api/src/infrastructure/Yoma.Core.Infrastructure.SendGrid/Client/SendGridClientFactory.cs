using Microsoft.Extensions.Options;
using SendGrid;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Infrastructure.SendGrid.Models;

namespace Yoma.Core.Infrastructure.SendGrid.Client
{
  public class SendGridClientFactory : IEmailProviderClientFactory
  {
    #region Class Variables
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly SendGridOptions _options;
    private readonly ISendGridClient _sendGridClient;
    #endregion

    #region Constructor
    public SendGridClientFactory(IEnvironmentProvider environmentProvider, IOptions<SendGridOptions> options, ISendGridClient sendGridClient)
    {
      _environmentProvider = environmentProvider;
      _options = options.Value;
      _sendGridClient = sendGridClient;
    }
    #endregion

    #region Public Members
    public IEmailProviderClient CreateClient()
    {
      return new SendGridClient(_environmentProvider, _options, _sendGridClient);
    }
    #endregion
  }
}
