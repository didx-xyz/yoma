using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkService
  {
    ReferralLinkInfo GetById(Guid id, bool includeComputed);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilter filter);

    ReferralLinkSearchResults Search(ReferralLinkSearchFilterAdmin filter);

    Task<ReferralLinkInfo> Create(ReferralLinkRequestCreate request);

    Task<ReferralLinkInfo> Update(ReferralLinkRequestUpdate request);

    Task<ReferralLinkInfo> UpdateStatus(Guid id, ReferralLinkStatus status);
  }
}
