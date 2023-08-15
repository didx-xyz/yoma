using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.Opportunity.Services
{
  public class OpportunityService : IOpportunityService
  {
    #region Class Variables
    private readonly IRepository<Models.Opportunity> _opportunityRepository;
    #endregion

    #region Constructor
    public OpportunityService(IRepository<Models.Opportunity> opportunityRepository)
    {
      _opportunityRepository = opportunityRepository;
    }
    #endregion

    #region Public Members

    #endregion
  }
}
