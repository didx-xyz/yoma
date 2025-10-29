using MediatR;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.MyOpportunity.Events;

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
    public async Task Handle(MyOpportunityEvent notification, CancellationToken cancellationToken)
    {
      await Task.CompletedTask;

      //link usages: move pending to completed based on opportunity completions
      //link: move active to limit reached based on program limits (CompletionLimitReferee || CompletionLimit)
    }
    #endregion
  }
}
