using MediatR;
using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Referral.Events
{
  public class MyOpportunityEventHandler : INotificationHandler<MyOpportunityEvent>
  {
    #region Class Variables
    private readonly ILogger<MyOpportunityEventHandler> _logger;
    #endregion

    #region Constructor
    public MyOpportunityEventHandler(ILogger<MyOpportunityEventHandler> logger)
    {
      _logger = logger;
    }
    #endregion

    #region Public Members  
    public Task Handle(MyOpportunityEvent notification, CancellationToken cancellationToken)
    {
      throw new NotImplementedException();

      //link usages: move pending to completed based on opportunity completions
      //link: move active to limit reached based on program limits (CompletionLimitReferee || CompletionLimit)
    }
    #endregion
  }
}
