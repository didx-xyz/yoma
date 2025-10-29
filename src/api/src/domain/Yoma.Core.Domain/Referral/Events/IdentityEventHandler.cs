using MediatR;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.IdentityProvider.Events;

namespace Yoma.Core.Domain.Referral.Events
{
  public class IdentityEventHandler : INotificationHandler<IdentityEvent>
  {
    #region Class Variables
    private readonly ILogger<IdentityEventHandler> _logger;
    #endregion

    #region Constructor
    public IdentityEventHandler(ILogger<IdentityEventHandler> logger)
    {
      _logger = logger;
    }
    #endregion

    #region Public Members
    public async Task Handle(IdentityEvent notification, CancellationToken cancellationToken)
    {
      await Task.CompletedTask;
   
      //link usages: move pending to completed based POP requirements
      //link: move active to limit reached based on program limits (CompletionLimitReferee || CompletionLimit)
    }
    #endregion
  }
}
