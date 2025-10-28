using MediatR;
using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Referral.Events
{
  public class IdentityActionEventHandler : INotificationHandler<IdentityActionEvent>
  {
    #region Class Variables
    private readonly ILogger<IdentityActionEventHandler> _logger;
    #endregion

    #region Constructor
    public IdentityActionEventHandler(ILogger<IdentityActionEventHandler> logger)
    {
      _logger = logger;
    }
    #endregion

    #region Public Members
    public Task Handle(IdentityActionEvent notification, CancellationToken cancellationToken)
    {
      throw new NotImplementedException();

      //link usages: move pending to completed based POP requirements
      //link: move active to limit reached based on program limits (CompletionLimitReferee || CompletionLimit)
    }
    #endregion
  }
}
