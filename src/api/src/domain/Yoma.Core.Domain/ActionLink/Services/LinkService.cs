using FluentValidation;
using Flurl;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Exceptions;
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
    private readonly IRepository<LinkUsageLog> _linkUsageLogRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public LinkService(IHttpContextAccessor httpContextAccessor,
      IShortLinkProviderClientFactory shortLinkProviderClientFactory,
      IUserService userService,
      ILinkStatusService linkStatusService,
      IRepository<Link> linkRepository,
      IRepository<LinkUsageLog> linkUsageLogRepository,
      IExecutionStrategyService executionStrategyService)
    {
      _httpContextAccessor = httpContextAccessor;
      _shortLinkProviderClient = shortLinkProviderClientFactory.CreateClient();
      _userService = userService;
      _linkStatusService = linkStatusService;
      _linkRepository = linkRepository;
      _linkUsageLogRepository = linkUsageLogRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public void AssertActive(Guid id)
    {
      var link = GetById(id);
      AssertActive(link);
    }

    public async Task<Link> Create(LinkRequestCreate request, bool ensureOrganizationAuthorization)
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
        UsagesLimit = request.UsagesLimit,
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

              //sharing links should always remain active; they cannot be deactivated, have no end date, and are not subject to usage limits
              AssertActive(itemExisting);

              return itemExisting;

            case LinkAction.Verify:
              item.URL = item.URL.AppendPathSegment(item.Id.ToString());
              break;

            default:
              throw new InvalidOperationException($"Invalid action of '{request.Action}' for entity type of '{request.EntityType}'");
          }
          break;

        default:
          throw new InvalidOperationException($"Invalid entity type of '{request.EntityType}'");
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

      return item;
    }

    public async Task<Link> LogUsage(Guid id)
    {
      var link = GetById(id);

      AssertActive(link);

      if (!HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor)) return link;

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var item = _linkUsageLogRepository.Query().SingleOrDefault(o => o.LinkId == id && o.UserId == user.Id);
      if (item != null) return link; //already claimed by the user

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        item = await _linkUsageLogRepository.Create(new LinkUsageLog
        {
          LinkId = id,
          UserId = user.Id,
        });

        link.UsagesTotal = (link.UsagesTotal ?? 0) + 1;
        if (link.UsagesLimit.HasValue && link.UsagesTotal == link.UsagesLimit) link.Status = LinkStatus.LimitReached;
        link = await _linkRepository.Update(link);

        scope.Complete();
      });

      return link;
    }
    #endregion

    #region Private Members
    private static void AssertActive(Link link)
    {
      switch (link.Status)
      {
        case LinkStatus.Inactive:
          throw new ValidationException("This link is no longer active");
        case LinkStatus.Expired:
          throw new ValidationException("This link has expired and can no longer be used");
        case LinkStatus.LimitReached:
          throw new ValidationException("This link has reached its usage limit and cannot be used further");
        case LinkStatus.Active:
          return;
        default:
          throw new InvalidOperationException($"Invalid status of '{link.Status}'");
      }
    }

    private Link GetById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return _linkRepository.Query().SingleOrDefault(o => o.Id == id)
       ?? throw new EntityNotFoundException($"Link with id '{id}' does not exist");
    }
    #endregion
  }
}
