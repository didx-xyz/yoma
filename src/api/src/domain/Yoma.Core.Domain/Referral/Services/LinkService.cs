using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkService : ILinkService
  {
    public Task<ReferralLinkInfo> Create(ReferralLinkRequestCreate request)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkInfo GetById(Guid id, bool includeComputed)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkSearchResults Search(ReferralLinkSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkSearchResults Search(ReferralLinkSearchFilterAdmin filter)
    {
      throw new NotImplementedException();
    }

    public Task<ReferralLinkInfo> Update(ReferralLinkRequestUpdate request)
    {
      throw new NotImplementedException();
    }

    public Task UpdateStatusByUserId(Guid userId, ReferralLinkStatus status)
    {
      throw new NotImplementedException();
    }

    public Task<ReferralLinkInfo> UpdateStatus(Guid id, ReferralLinkStatus status)
    {
      throw new NotImplementedException();
    }
  }
}
