using Yoma.Core.Domain.Referral.Interfaces.Lookups;

namespace Yoma.Core.Domain.Referral.Services.Lookups
{
  public class LinkStatusService : ILinkStatusService
  {
    public Models.Lookups.LinkStatus GetById(Guid id)
    {
      throw new NotImplementedException();
    }

    public Models.Lookups.LinkStatus? GetByIdOrNull(Guid id)
    {
      throw new NotImplementedException();
    }

    public Models.Lookups.LinkStatus GetByName(string name)
    {
      throw new NotImplementedException();
    }

    public Models.Lookups.LinkStatus? GetByNameOrNull(string name)
    {
      throw new NotImplementedException();
    }

    public List<Models.Lookups.LinkStatus> List()
    {
      throw new NotImplementedException();
    }
  }
}
