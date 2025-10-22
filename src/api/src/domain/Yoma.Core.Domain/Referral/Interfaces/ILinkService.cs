using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkService
  {
    ReferralLink GetById(Guid id, bool includeChildItems, bool ensureOwnership, bool allowAdminOverride, bool? includeQRCode);

    ReferralLink? GetByIdOrNull(Guid id, bool includeChildItems, bool ensureOwnership, bool allowAdminOverride, bool? includeQRCode);

    ReferralLink? GetByNameOrNull(Guid userId, Guid programId, string name, bool includeChildItems, bool? includeQRCode);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilter filter);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilterAdmin filter);

    Task<ReferralLink> Create(ReferralLinkRequestCreate request);

    Task<ReferralLink> Update(ReferralLinkRequestUpdate request);

    Task<ReferralLink> Cancel(Guid id);
  }
}
