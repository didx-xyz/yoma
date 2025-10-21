using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkService
  {
    ReferralLink GetById(Guid id, bool includeComputed);

    ReferralLink? GetByIdOrNull(Guid id, bool includeComputed);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilter filter);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilterAdmin filter);

    Task<ReferralLink> Create(ReferralLinkRequestCreate request);

    Task<ReferralLink> Update(ReferralLinkRequestUpdate request);

    Task UpdateStatusByUserId(Guid userId, ReferralLinkStatus status);

    Task<ReferralLink> UpdateStatus(Guid id, ReferralLinkStatus status);
  }
}
