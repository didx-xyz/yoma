using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkUsageService : ILinkUsageService
  {
    public Task ClaimAsReferee(Guid linkId)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkUsageInfo GetUsageById(Guid Id)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkUsageInfo GetByLinkIdAsReferee(Guid linkId)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkUsageSearchResults Search(ReferralLinkUsageSearchFilterAdmin filter)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkUsageSearchResults SearchAsReferee(ReferralLinkUsageSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkUsageSearchResults SearchAsReferrer(ReferralLinkUsageSearchFilter filter)
    {
      throw new NotImplementedException();
    }
  }
}
