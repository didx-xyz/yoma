using Yoma.Core.Domain.PartnerSharing.Models;

namespace Yoma.Core.Domain.PartnerSharing.Interfaces.Provider
{
  public interface ISharingProviderClient
  {
    Task<string> CreateOpportunity(OpportunityRequestUpsert request);

    Task UpdateOpportunity(OpportunityRequestUpsert request);

    Task DeleteOpportunity(string externalId);
  }
}
