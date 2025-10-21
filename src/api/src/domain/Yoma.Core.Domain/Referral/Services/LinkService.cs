using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Extensions;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.ShortLinkProvider;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkService : ILinkService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IShortLinkProviderClient _shortLinkProviderClient;

    private readonly IUserService _userService;
    private readonly IProgramService _programService;
    private readonly ILinkStatusService _linkStatusService;
    private readonly IBlockService _blockService;

    private readonly IRepositoryBatchedValueContains<ReferralLink> _linkRepository;
    #endregion

    #region Constructor
    public LinkService(
      IOptions<AppSettings> appSettings,

      IHttpContextAccessor httpContextAccessor,
      IShortLinkProviderClient shortLinkProviderClient,

      IUserService userService,
      IProgramService programService,
      ILinkStatusService linkStatusService,
      IBlockService blockService,

      IRepositoryBatchedValueContains<ReferralLink> linkRepository)
    {
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));

      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _shortLinkProviderClient = shortLinkProviderClient ?? throw new ArgumentNullException(nameof(shortLinkProviderClient));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _linkStatusService = linkStatusService ?? throw new ArgumentNullException(nameof(linkStatusService));
      _blockService = blockService ?? throw new ArgumentNullException(nameof(blockService));

      _linkRepository = linkRepository ?? throw new ArgumentNullException(nameof(linkRepository));
    }
    #endregion

    #region Public Members
    public ReferralLink GetById(Guid id, bool includeComputed)
    {
      var result = GetByIdOrNull(id, includeComputed)
        ?? throw new EntityNotFoundException($"{nameof(ReferralLink)} with id '{id}' does not exist");

      return result;
    }

    public ReferralLink? GetByIdOrNull(Guid id, bool includeComputed)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _linkRepository.Query().SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      if (HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) return result;

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      if (result.UserId != user.Id) throw new SecurityException("Unauthorized");

      if (includeComputed)
      {
        var resultBlock = _blockService.GetByUserIdOrNull(result.Id);
        result.Blocked = resultBlock != null;
        result.BlockedDate = resultBlock?.DateCreated;
      }

      return result;
    }

    public ReferralLinkSearchResults Search(ReferralLinkSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public ReferralLinkSearchResults Search(ReferralLinkSearchFilterAdmin filter)
    {
      throw new NotImplementedException();
    }

    public async Task<ReferralLink> Create(ReferralLinkRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      //TODO: Validator

      var program = _programService.GetById(request.ProgramId, false, false);

      if (program.Status != ProgramStatus.Active || program.DateStart > DateTimeOffset.Now)
        throw new ValidationException($"Referral program '{program.Name}' is not active or has not started");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var statusLinkActive = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString());

      var existingLink = _linkRepository.Query().FirstOrDefault(o => o.ProgramId == program.Id && o.UserId == user.Id && o.StatusId == statusLinkActive.Id);

      if (!program.MultipleLinksAllowed && existingLink != null)
        throw new ValidationException($"Multiple active referral links are not allowed for program '{program.Name}'");

      var result = new ReferralLink
      {
        Id = Guid.NewGuid(),
        Name = request.Name,
        Description = request.Description,
        ProgramId = program.Id,
        ProgramName = program.Name,
        UserId = user.Id,
        UserDisplayName = user.DisplayName,
        UserEmail = user.Email,
        UserPhoneNumber = user.PhoneNumber,
        Blocked = false,
        StatusId = statusLinkActive.Id,
        Status = ReferralLinkStatus.Active
      };

      result.URL= result.ClaimURL(_appSettings.AppBaseURL);
      result = await GenerateShortLink(result);

      result = await _linkRepository.Create(result);

      return result;
    }

    public Task<ReferralLink> Update(ReferralLinkRequestUpdate request)
    {
      throw new NotImplementedException();
    }

    public Task UpdateStatusByUserId(Guid userId, ReferralLinkStatus status)
    {
      throw new NotImplementedException();
    }

    public Task<ReferralLink> UpdateStatus(Guid id, ReferralLinkStatus status)
    {
      throw new NotImplementedException();
    }
    #endregion

    #region Private Members
    private async Task<ReferralLink> GenerateShortLink(ReferralLink item)
    {
      var responseShortLink = await _shortLinkProviderClient.CreateShortLink(new ShortLinkRequest
      {
        Type = LinkType.ReferralProgram,
        Action = LinkAction.Claim,
        Title = item.Name,
        URL = item.URL
      });

      item.ShortURL = responseShortLink.Link;

      return item;
    }
    #endregion
  }
}
