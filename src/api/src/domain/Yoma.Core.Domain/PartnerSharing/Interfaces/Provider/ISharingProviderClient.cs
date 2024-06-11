namespace Yoma.Core.Domain.PartnerSharing.Interfaces.Provider
{
  public interface ISharingProviderClient
  {
    Task<string> CreateOpportunity(Opportunity.Models.Opportunity opportunity);

    Task UpdateOpportunity(string externalId, Opportunity.Models.Opportunity opportunity);

    Task DeleteOpportunity(string externalId);
  }
}
