using FluentValidation;
using Flurl;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.ActionLink.Validators;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
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

    private readonly LinkRequestCreateValidator _linkRequestCreateValidator;

    private static readonly LinkStatus[] Statuses_Activatable = [LinkStatus.Inactive];
    private static readonly LinkStatus[] Statuses_DeActivatable = [LinkStatus.Active];
    #endregion

    #region Constructor
    public LinkService(IHttpContextAccessor httpContextAccessor,
      IShortLinkProviderClientFactory shortLinkProviderClientFactory,
      IUserService userService,
      ILinkStatusService linkStatusService,
      IRepository<Link> linkRepository,
      IRepository<LinkUsageLog> linkUsageLogRepository,
      IExecutionStrategyService executionStrategyService,
      LinkRequestCreateValidator linkRequestCreateValidator)
    {
      _httpContextAccessor = httpContextAccessor;
      _shortLinkProviderClient = shortLinkProviderClientFactory.CreateClient();
      _userService = userService;
      _linkStatusService = linkStatusService;
      _linkRepository = linkRepository;
      _linkUsageLogRepository = linkUsageLogRepository;
      _executionStrategyService = executionStrategyService;
      _linkRequestCreateValidator = linkRequestCreateValidator;
    }
    #endregion

    #region Public Members
    public Link GetById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return _linkRepository.Query().SingleOrDefault(o => o.Id == id)
       ?? throw new EntityNotFoundException($"Link with id '{id}' does not exist");
    }

    public void AssertActive(Guid id)
    {
      var link = GetById(id);
      AssertActive(link);
    }

    public List<Link> ListByEntityAndAction(LinkEntityType entityType, LinkAction action, Guid entityId)
    {
      if (entityId == Guid.Empty)
        throw new ArgumentNullException(nameof(entityId));

      var query = _linkRepository.Query().Where(o => o.EntityType == entityType.ToString() && o.Action == action.ToString());

      query = entityType switch
      {
        LinkEntityType.Opportunity => query.Where(o => o.OpportunityId == entityId),
        _ => throw new InvalidOperationException($"Invalid / unsupported entity type of '{entityType}'"),
      };

      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id);

      return [.. query];
    }

    public async Task<Link> Create(LinkRequestCreate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      await _linkRequestCreateValidator.ValidateAndThrowAsync(request);

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
        DateEnd = request.DateEnd.HasValue ? request.DateEnd.Value.ToEndOfDay() : null,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id,
      };

      Link? itemExisting = null;
      IQueryable<Link>? queryItemExisting = null;
      switch (request.EntityType)
      {
        case LinkEntityType.Opportunity:
          item.OpportunityId = request.EntityId;

          queryItemExisting = _linkRepository.Query().Where(o => o.EntityType == item.EntityType && o.Action == item.Action && o.OpportunityId == item.OpportunityId);  

          switch (request.Action)
          {
            case LinkAction.Share:
              if (request.UsagesLimit.HasValue || request.DateEnd.HasValue)
                throw new ValidationException($"Neither a usage limit nor an end date is supported by the link with action '{request.Action}'.");

              itemExisting = queryItemExisting.SingleOrDefault();
              if (itemExisting == null) break;

              if (!string.Equals(itemExisting.URL, item.URL))
                throw new DataInconsistencyException($"URL mismatch detected for link with id '{itemExisting.Id}'");

              //sharing links should always remain active; they cannot be deactivated, have no end date, and are not subject to usage limits
              AssertActive(itemExisting);

              return itemExisting;

            case LinkAction.Verify:
              if (!request.UsagesLimit.HasValue && !request.DateEnd.HasValue)
                throw new ValidationException($"Either a usage limit or an end date is required for the link with action '{request.Action}'.");

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
              itemExisting = queryItemExisting.Where(o => o.Name.ToLower() == item.Name.ToLower()).SingleOrDefault();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
              if (itemExisting != null)
                throw new ValidationException($"Link with name '{item.Name}' already exists for the opportunity");  

              item.URL = item.URL.AppendPathSegment(item.Id.ToString());
              break;

            default:
              throw new InvalidOperationException($"Invalid / unsupported action of '{request.Action}' for entity type of '{request.EntityType}'");
          }
          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported entity type of '{request.EntityType}'");
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

      //only track unique usages provided authenticated
      if (!HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor)) return link;

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var item = _linkUsageLogRepository.Query().SingleOrDefault(o => o.LinkId == id && o.UserId == user.Id);
      if (item != null) return link; //already used by the user

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

    public async Task<Link> UpdateStatus(Guid id, LinkStatus status)
    {
      var result = GetById(id);

      var action = Enum.Parse<LinkAction>(result.Action);

      switch (action)
      {
        case LinkAction.Share:
          throw new ValidationException($"Link with action '{result.Action}' status can not be changed and remains active indefinitely");

        case LinkAction.Verify:
          switch (status)
          {
            case LinkStatus.Active:
              if (!Statuses_Activatable.Contains(result.Status))
                throw new ValidationException($"Link can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

              //ensure not expired but not yet flagged by background service
              if (result.DateEnd.HasValue && result.DateEnd.Value <= DateTimeOffset.UtcNow)
                throw new ValidationException($"Link cannot be activated because its end date ('{result.DateEnd:yyyy-MM-dd}') is in the past");

              result.StatusId = _linkStatusService.GetByName(LinkStatus.Active.ToString()).Id;
              result.Status = LinkStatus.Active;
              break;

            case LinkStatus.Inactive:
              if (!Statuses_DeActivatable.Contains(result.Status))
                throw new ValidationException($"Link can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

              result.StatusId = _linkStatusService.GetByName(LinkStatus.Inactive.ToString()).Id;
              result.Status = LinkStatus.Inactive;
              break;

            default:
              throw new InvalidOperationException($"Invalid / unsupported status of '{status}'");
          }
          break;
      }

      result = await _linkRepository.Update(result);
      return result;
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
          throw new InvalidOperationException($"Invalid / unsupported status of '{link.Status}'");
      }
    }
    #endregion
  }
}
