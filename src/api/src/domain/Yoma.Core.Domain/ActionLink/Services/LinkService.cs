using Flurl;
using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.ActionLink.Extensions;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;

namespace Yoma.Core.Domain.ActionLink.Services
{
  public class LinkService : ILinkService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IShortLinkProviderClient _shortLinkProviderClient;
    private readonly IUserService _userService;
    private readonly ILinkStatusService _linkStatusService;
    private readonly IRepository<Link> _linkRepository;
    #endregion

    #region Constructor
    public LinkService(IHttpContextAccessor httpContextAccessor,
      IShortLinkProviderClientFactory shortLinkProviderClientFactory,
      IUserService userService,
      ILinkStatusService linkStatusService,
      IRepository<Link> linkRepository)
    {
      _httpContextAccessor = httpContextAccessor;
      _shortLinkProviderClient = shortLinkProviderClientFactory.CreateClient();
      _userService = userService;
      _linkStatusService = linkStatusService;
      _linkRepository = linkRepository;
    }
    #endregion

    #region Public Members
    public async Task<LinkInfo> Create(LinkRequestCreate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      //TODO: validation

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var item = new Link
      {
        Id = Guid.NewGuid(),
        Name = request.Name,
        Description = request.Description,
        EntityType = request.EntityType.ToString(),
        Action = request.Action.ToString(),
        Status = LinkStatus.Active,
        StatusId = _linkStatusService.GetByName(LinkStatus.Active.ToString()).Id,
        URL = request.URL,
        ParticipantLimit = request.ParticipantLimit,
        DateEnd = request.DateEnd,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id,
      };

      switch (request.EntityType)
      {
        case LinkEntityType.Opportunity:
          item.OpportunityId = request.EntityId;

          switch (request.Action)
          {
            case LinkAction.Share:
              var itemExisting = _linkRepository.Query().SingleOrDefault(o => o.EntityType == item.EntityType && o.Action == item.Action && o.OpportunityId == item.OpportunityId);
              if (itemExisting == null) break;

              if (!string.Equals(itemExisting.URL, item.URL))
                throw new DataInconsistencyException($"URL mismatch detected for link with id '{itemExisting.Id}'");

              if (itemExisting.Status != LinkStatus.Active)
                throw new DataInconsistencyException($"Link status mismatch detected for link with id '{itemExisting.Id}'. Expected status to be '{LinkStatus.Active}' for action '{request.Action}', but found status as '{itemExisting.Status}'.");

              return itemExisting.ToLinkInfo(request.IncludeQRCode == true ? QRCodeHelper.GenerateQRCodeBase64(itemExisting.ShortURL) : null);

            case LinkAction.Verify:
              item.URL = item.URL.AppendPathSegment(item.Id.ToString());
              break;

            default:
              throw new InvalidOperationException($"Invalid action of '{request.Action}' for entity type of '{request.EntityType}'");
          }
          break;

        default:
          throw new InvalidCastException($"Invalid entity type of '{request.EntityType}'");
      }

      var responseShortLink = await _shortLinkProviderClient.CreateShortLink(new ShortLinkRequest
      {
        Type = request.EntityType,
        Action = request.Action,
        Title = request.Name,
        URL = request.URL
      });

      item.ShortURL = responseShortLink.Link;

      item = await _linkRepository.Create(item);

      return item.ToLinkInfo(request.IncludeQRCode == true ? QRCodeHelper.GenerateQRCodeBase64(item.ShortURL) : null);
    }
    #endregion
  }
}
