using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkService
  {
    ReferralLink GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOwnership, bool allowAdminOverride, bool? includeQRCode, LockMode? lockMode = null);

    ReferralLink? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed, bool ensureOwnership, bool allowAdminOverride, bool? includeQRCode, LockMode? lockMode = null);

    ReferralLink? GetByNameOrNull(Guid userId, Guid programId, string name, bool includeChildItems, bool includeComputed, bool? includeQRCode);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilter filter);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilterAdmin filter);

    Task<ReferralLink> Create(ReferralLinkRequestCreate request);

    Task<ReferralLink> Update(ReferralLinkRequestUpdate request);

    Task<ReferralLink> Cancel(Guid id);

    Task<ReferralLink> ProcessCompletion(Program program, ReferralLink link, decimal? rewardAmount);
  }
}
