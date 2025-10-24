using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkMaintenanceService : ILinkMaintenanceService
  {
    #region Class Variables
    private readonly ILinkStatusService _linkStatusService;

    private readonly IRepositoryBatchedValueContainsWithNavigation<ReferralLink> _linkRepository;
    #endregion

    #region Constructor
    public LinkMaintenanceService(
      ILinkStatusService linkStatusService,
      IRepositoryBatchedValueContainsWithNavigation<ReferralLink> linkRepository)
    {
      _linkStatusService = linkStatusService ?? throw new ArgumentNullException(nameof(linkStatusService));
      _linkRepository = linkRepository ?? throw new ArgumentNullException(nameof(linkRepository));
    }
    #endregion

    #region Public Members
    public async Task CancelByUserId(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var statusActive = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString());

      var items = _linkRepository.Query()
        .Where(o => o.UserId == userId && o.StatusId == statusActive.Id)
        .ToList();

      var statusCancelled = _linkStatusService.GetByName(ReferralLinkStatus.Cancelled.ToString());

      items.ForEach(o =>
      {
        o.StatusId = statusCancelled.Id;
        o.Status = ReferralLinkStatus.Cancelled;
      });

      await _linkRepository.Update(items);
    }

    public async Task CancelByProgramId(Guid programId)
    {
      if (programId == Guid.Empty)
        throw new ArgumentNullException(nameof(programId));

      var statusActive = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString());

      var items = _linkRepository.Query()
        .Where(o => o.ProgramId == programId && o.StatusId == statusActive.Id)
        .ToList();

      var status = _linkStatusService.GetByName(ReferralLinkStatus.Cancelled.ToString());

      items.ForEach(o =>
      {
        o.StatusId = status.Id;
        o.Status = ReferralLinkStatus.Cancelled;
      });

      await _linkRepository.Update(items);
    }
    #endregion
  }
}
