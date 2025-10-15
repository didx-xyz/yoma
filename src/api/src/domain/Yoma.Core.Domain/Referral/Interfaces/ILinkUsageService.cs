using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkUsageService
  {
    ReferralLinkUsageInfo GetByIdAsReferee(Guid linkId);

    ReferralLinkUsageSearchResults Search(ReferralLinkUsageSearchFilterAdmin filter);

    ReferralLinkUsageSearchResults SearchAsReferrer(ReferralLinkUsageSearchFilter filter);

    ReferralLinkUsageSearchResults SearchAsReferee(ReferralLinkUsageSearchFilter filter);

    Task ClaimAsReferee(Guid linkId);
  }
}
