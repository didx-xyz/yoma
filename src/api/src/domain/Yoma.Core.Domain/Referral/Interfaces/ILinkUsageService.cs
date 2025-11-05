using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkUsageService
  {
    ReferralLinkUsageInfo GetById(Guid id, bool includeComputed, bool ensureOwnership, bool allowAdminOverride);

    ReferralLinkUsageInfo GetByProgramIdAsReferee(Guid programId, bool includeComputed);

    ReferralLinkUsageSearchResults Search(ReferralLinkUsageSearchFilterAdmin filter);

    ReferralLinkUsageSearchResults SearchAsReferrer(ReferralLinkUsageSearchFilter filter);

    ReferralLinkUsageSearchResults SearchAsReferee(ReferralLinkUsageSearchFilter filter);

    Task ClaimAsReferee(Guid linkId);

    Task ProcessProgressByUserId(Guid userId);
  }
}
