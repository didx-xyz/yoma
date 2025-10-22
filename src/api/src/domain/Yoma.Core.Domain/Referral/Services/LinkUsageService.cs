using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkUsageService : ILinkUsageService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IUserService _userService; 

    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;
    #endregion

    #region Constrcutor
    public LinkUsageService(
      IHttpContextAccessor httpContextAccessor,
      IUserService userService,


      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository)
    {
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));

      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
    }
    #endregion

    #region Public Members
    public ReferralLinkUsageInfo GetUsageById(Guid id, bool includeComputed, bool ensureOwnership, bool allowAdminOverride)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));

      var result = _linkUsageRepository.Query().SingleOrDefault(x => x.Id == id)
        ?? throw new EntityNotFoundException($"Referral link usage with Id '{id}' does not exist");

      if (!ensureOwnership) return ToInfo(result).Result;

      if (allowAdminOverride && _httpContextAccessor.HttpContext!.User.IsInRole("Admin")) return ToInfo(result).Result;

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      if (result.UserId != user.Id //as referee
        || result.UserIdReferrer != user.Id) //as referrer
        throw new SecurityException("Unauthorized");

      return ToInfo(result).Result;
    }

    public ReferralLinkUsageInfo GetByProgramIdAsReferee(Guid programId, bool includeComputed)
    {
      if (programId == Guid.Empty)
        throw new ArgumentNullException(nameof(programId));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var usage = _linkUsageRepository.Query()
        .SingleOrDefault(x => x.ProgramId == programId && x.UserId == user.Id);

      var results = _linkUsageRepository.Query().Where(x => x.ProgramId == programId && x.UserId == user.Id).ToList();

      if (results.Count > 1)
        throw new DataInconsistencyException($"Multiple referral link usages found for program '{programId}' for the current user: Link id's '{string.Join(", ", results.Select(x => x.LinkId))}'");

      if (results.Count == 0)
        throw new EntityNotFoundException($"Referral link usage for program '{programId}' and the current user does not exist");

      return ToInfo(results.Single()).Result;
    }


    public ReferralLinkUsageSearchResults SearchAsReferee(ReferralLinkUsageSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkUsageSearchResults SearchAsReferrer(ReferralLinkUsageSearchFilter filter)
    {
      throw new NotImplementedException();
    }
    public ReferralLinkUsageSearchResults Search(ReferralLinkUsageSearchFilterAdmin filter)
    {
      throw new NotImplementedException();
    }

    public Task ClaimAsReferee(Guid linkId)
    {
      throw new NotImplementedException();
    }
    #endregion

    #region Private Members
    private async Task<ReferralLinkUsageInfo> ToInfo(ReferralLinkUsage item)
    {
      return new ReferralLinkUsageInfo
      {
        Id = item.Id,
        ProgramId = item.ProgramId,
        ProgramName = item.ProgramName,
        LinkId = item.LinkId,
        LinkName = item.LinkName,
        UserIdReferrer = item.UserIdReferrer,
        UserDisplayNameReferrer = item.UserDisplayNameReferrer!,
        UserEmailReferrer = item.UserEmailReferrer,
        UserPhoneNumberReferrer = item.UserPhoneNumberReferrer,
        UserId = item.UserId,
        UserDisplayName = item.UserDisplayName!,
        UserEmail = item.UserEmail,
        UserPhoneNumber = item.UserPhoneNumber,
        StatusId = item.StatusId,
        Status = item.Status,
        DateClaimed = item.DateClaimed,
        DateCompleted = item.DateCompleted,
        DateExpired = item.DateExpired
      };
    }
    #endregion
  }
}
