using FluentValidation;
using Flurl;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Data;
using System.Transactions;
using Yoma.Core.Domain.ActionLink.Extensions;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.ActionLink.Validators;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.IdentityProvider.Extensions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;
using Microsoft.Extensions.Caching.Memory;

namespace Yoma.Core.Domain.ActionLink.Services
{
  public class LinkService : ILinkService
  {
    #region Class Variables
    private readonly ILogger<LinkService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IShortLinkProviderClient _shortLinkProviderClient;
    private readonly IUserService _userService;
    private readonly IOrganizationService _organizationService;
    private readonly IOpportunityService _opportunityService;
    private readonly ILinkStatusService _linkStatusService;
    private readonly IRepositoryBatched<Link> _linkRepository;
    private readonly IRepository<LinkUsageLog> _linkUsageLogRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly INotificationURLFactory _notificationURLFactory;
    private readonly IIdentityProviderClient _identityProviderClient;

    private readonly LinkRequestCreateValidatorShare _linkRequestCreateValidatorShare;
    private readonly LinkRequestCreateValidatorVerify _linkRequestCreateValidatorVerify;
    private readonly LinkSearchFilterValidator _linkSearchFilterValidator;
    private readonly LinkRequestUpdateStatusValidator _linkRequestUpdateStatusValidator;

    //a link can only be made active ONCE as it might have a distribution list that gets notified upon approval / activation; thus an active link can not be deactivated 
    private static readonly LinkStatus[] Statuses_Activatable = [LinkStatus.Inactive];
    private static readonly LinkStatus[] Statuses_Declinable = [LinkStatus.Inactive];
    private static readonly LinkStatus[] Statuses_DeActivatable = [LinkStatus.Declined]; //send for re-approval
    private static readonly LinkStatus[] Statuses_CanDelete = [LinkStatus.Active, LinkStatus.Inactive, LinkStatus.Declined];
    #endregion

    #region Constructor
    public LinkService(ILogger<LinkService> logger,
      IOptions<AppSettings> appSettings,
      IMemoryCache memoryCache,
      IHttpContextAccessor httpContextAccessor,
      IShortLinkProviderClientFactory shortLinkProviderClientFactory,
      IUserService userService,
      IOrganizationService organizationService,
      ILinkStatusService linkStatusService,
      IOpportunityService opportunityService,
      IRepositoryBatched<Link> linkRepository,
      IRepository<LinkUsageLog> linkUsageLogRepository,
      IExecutionStrategyService executionStrategyService,
      INotificationDeliveryService notificationDeliveryService,
      INotificationURLFactory notificationURLFactory,
      IIdentityProviderClientFactory identityProviderClientFactory,
      LinkRequestCreateValidatorShare linkRequestCreateValidatorShare,
      LinkRequestCreateValidatorVerify linkRequestCreateValidatorVerify,
      LinkSearchFilterValidator linkSearchFilterValidator,
      LinkRequestUpdateStatusValidator linkRequestUpdateStatusValidator)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _httpContextAccessor = httpContextAccessor;
      _shortLinkProviderClient = shortLinkProviderClientFactory.CreateClient();
      _userService = userService;
      _organizationService = organizationService;
      _opportunityService = opportunityService;
      _linkStatusService = linkStatusService;
      _linkRepository = linkRepository;
      _linkUsageLogRepository = linkUsageLogRepository;
      _executionStrategyService = executionStrategyService;
      _notificationDeliveryService = notificationDeliveryService;
      _notificationURLFactory = notificationURLFactory;
      _identityProviderClient = identityProviderClientFactory.CreateClient();
      _linkRequestCreateValidatorShare = linkRequestCreateValidatorShare;
      _linkRequestCreateValidatorVerify = linkRequestCreateValidatorVerify;
      _linkSearchFilterValidator = linkSearchFilterValidator;
      _linkRequestUpdateStatusValidator = linkRequestUpdateStatusValidator;
    }
    #endregion

    #region Public Members
    public LinkInfo GetById(Guid id, bool ensureOrganizationAuthorization, bool? includeQRCode)
    {
      var link = GetById(id);

      if (ensureOrganizationAuthorization)
        EnsureOrganizationAuthorization(link);

      return link.ToLinkInfo(includeQRCode);
    }

    public void AssertActive(Guid id)
    {
      var link = GetById(id);
      AssertActive(link);
    }

    public LinkSearchResult Search(LinkSearchFilter filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter);

      _linkSearchFilterValidator.ValidateAndThrow(filter);

      //organizations
      if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
      {
        if (filter.Organizations != null && filter.Organizations.Count != 0)
        {
          filter.Organizations = [.. filter.Organizations.Distinct()];
          _organizationService.IsAdminsOf(filter.Organizations, true);
        }
        else
          filter.Organizations = [.. _organizationService.ListAdminsOf(false).Select(o => o.Id)];
      }

      //entity type
      var query = _linkRepository.Query().Where(o => o.EntityType == filter.EntityType.ToString());

      //action
      if (filter.Action.HasValue)
        query = query.Where(o => o.Action == filter.Action.ToString());

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = [.. filter.Statuses.Distinct()];
        var statusIds = filter.Statuses.Select(o => _linkStatusService.GetByName(o.ToString())).Select(o => o.Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      switch (filter.EntityType)
      {
        case LinkEntityType.Opportunity:
          // opportunities
          if (filter.Entities != null && filter.Entities.Count != 0)
          {
            filter.Entities = [.. filter.Entities.Distinct()];
            query = query.Where(o => filter.Entities.Contains(o.OpportunityId!.Value));
          }

          // organizations
          if (filter.Organizations != null && filter.Organizations.Count != 0)
          {
            filter.Organizations = [.. filter.Organizations.Distinct()];
            query = query.Where(o => filter.Organizations.Contains(o.OpportunityOrganizationId!.Value));
          }
          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported entity type of '{filter.EntityType}'");
      }

      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id);

      var result = new LinkSearchResult();

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query.ToList().Select(o => o.ToLinkInfo(false))];
      return result;
    }

    public async Task<LinkInfo> GetOrCreateShare(LinkRequestCreateShare request, bool publishedOrExpiredOnly, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      await _linkRequestCreateValidatorShare.ValidateAndThrowAsync(request);

      var item = LinkFromRequest(request, LinkStatus.Active, ensureOrganizationAuthorization);

      switch (request.EntityType)
      {
        case LinkEntityType.Opportunity:
          var opportunity = ValidateAndInitializeOpportunity(request, item, publishedOrExpiredOnly, ensureOrganizationAuthorization);
          item.URL = opportunity.YomaInfoURL(_appSettings.AppBaseURL);

          var itemExisting = _linkRepository.Query().Where(o => o.EntityType == item.EntityType && o.Action == item.Action && o.OpportunityId == item.OpportunityId).SingleOrDefault();
          if (itemExisting == null) break;

          if (!string.Equals(itemExisting.URL, item.URL))
            throw new DataInconsistencyException($"URL mismatch detected for existing link with id '{itemExisting.Id}'");

          //sharing links should always remain active; they cannot be deactivated, have no end date, and are not subject to usage limits
          AssertActive(itemExisting);

          await LogUsage(itemExisting);

          return itemExisting.ToLinkInfo(request.IncludeQRCode);

        default:
          throw new InvalidOperationException($"Invalid / unsupported entity type of '{request.EntityType}'");
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        item = await GenerateShortLinkAndCreate(request, item);

        await LogUsage(item);

        scope.Complete();
      });

      return item.ToLinkInfo(request.IncludeQRCode);
    }

    public async Task<LinkInfo> CreateVerify(LinkRequestCreateVerify request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      request.DistributionList = request.DistributionList?.Select(item =>
      {
        if (string.IsNullOrWhiteSpace(item))
          return item;

        if (item.Contains('@'))
          return item.Trim();

        return item.NormalizePhoneNumber(true);
      }).ToList();

      await _linkRequestCreateValidatorVerify.ValidateAndThrowAsync(request);

      if (request.DistributionList != null)
      {
        request.DistributionList = [.. request.DistributionList.Distinct()];
        //with LockToDistributionList, DistributionList is required and usage limit is set to the count of the distribution list
        if (request.LockToDistributionList == true) request.UsagesLimit = request.DistributionList.Count;
      }

      if (!request.UsagesLimit.HasValue && !request.DateEnd.HasValue)
        throw new ValidationException($"Either a usage limit or an end date is required");

      var item = LinkFromRequest(request, LinkStatus.Inactive, ensureOrganizationAuthorization);
      item.UsagesLimit = request.UsagesLimit;
      item.DateEnd = request.DateEnd.HasValue ? request.DateEnd.Value.ToEndOfDay() : null;
      item.DistributionList = request.DistributionList == null ? null : JsonConvert.SerializeObject(request.DistributionList);
      item.LockToDistributionList = request.LockToDistributionList;

      switch (request.EntityType)
      {
        case LinkEntityType.Opportunity:
          var opportunity = ValidateAndInitializeOpportunity(request, item, false, ensureOrganizationAuthorization);

          if (!opportunity.VerificationEnabled)
            throw new ValidationException($"Link cannot be created as the opportunity '{opportunity.Title}' does not support verification");

          if (!opportunity.VerificationMethod.HasValue) //support any verification method
            throw new DataInconsistencyException($"Data inconsistency detected: The opportunity '{opportunity.Title}' has verification enabled, but no verification method is set");

          if (!opportunity.Published)
            throw new ValidationException($"Link cannot be created as the opportunity '{opportunity.Title}' has not been published");

          item.URL = opportunity.YomaInstantVerifyURL(_appSettings.AppBaseURL).AppendPathSegment(item.Id.ToString());

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
          var itemExisting = _linkRepository.Query()
            .Where(o => o.EntityType == item.EntityType && o.Action == item.Action && o.OpportunityId == item.OpportunityId && o.Name.ToLower() == item.Name.ToLower()).SingleOrDefault();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

          if (itemExisting != null)
            throw new ValidationException($"Link with name '{item.Name}' already exists for the opportunity");

          item = await GenerateShortLinkAndCreate(request, item);
          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported entity type of '{request.EntityType}'");
      }

      await SendNotification(item, NotificationType.ActionLink_Verify_Approval_Requested);

      return item.ToLinkInfo(request.IncludeQRCode);
    }

    public async Task<LinkInfo> LogUsage(Guid id)
    {
      var link = GetById(id);

      return await LogUsage(link);
    }

    public async Task<LinkInfo> UpdateStatus(Guid id, LinkRequestUpdateStatus request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _linkRequestUpdateStatusValidator.ValidateAndThrowAsync(request);

      var link = GetById(id);
      EnsureOrganizationAuthorization(link);

      var action = Enum.Parse<LinkAction>(link.Action);

      NotificationActionLinkVerify? notificationDataDistributionList = null;
      NotificationType? notificationType = null;
      switch (action)
      {
        case LinkAction.Share:
          throw new ValidationException($"Link with action '{link.Action}' status can not be changed and remains active indefinitely");

        case LinkAction.Verify:
          switch (request.Status)
          {
            case LinkStatus.Active:
              if (link.Status == LinkStatus.Active) return link.ToLinkInfo(false);

              if (!Statuses_Activatable.Contains(link.Status))
                throw new ValidationException($"Link can not be activated (current status '{link.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

              if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

              //ensure not expired but not yet flagged by background service
              if (link.DateEnd.HasValue && link.DateEnd.Value <= DateTimeOffset.UtcNow)
                throw new ValidationException($"Link cannot be activated because its end date ('{link.DateEnd:yyyy-MM-dd}') is in the past");

              link.CommentApproval = request.Comment;

              var entityType = Enum.Parse<LinkEntityType>(link.EntityType, true);
              switch (entityType)
              {
                case LinkEntityType.Opportunity:
                  if (!link.OpportunityId.HasValue || string.IsNullOrEmpty(link.OpportunityTitle))
                    throw new InvalidOperationException("Opportunity details expected");

                  var opportunity = _opportunityService.GetById(link.OpportunityId.Value, false, true, ensureOrganizationAuthorization);

                  if (!opportunity.VerificationEnabled)
                    throw new ValidationException($"Link cannot be activated as the opportunity '{opportunity.Title}' does not support verification");

                  if (!opportunity.VerificationMethod.HasValue) //support any verification method
                    throw new DataInconsistencyException($"Data inconsistency detected: The opportunity '{opportunity.Title}' has verification enabled, but no verification method is set");

                  if (!opportunity.Published)
                    throw new ValidationException($"Link cannot be activated as the opportunity '{opportunity.Title}' has not been published");

                  notificationDataDistributionList = new NotificationActionLinkVerify
                  {
                    EntityTypeDesc = $"{entityType.ToString().ToLower()}(ies)",
                    YoIDURL = _notificationURLFactory.OpportunityVerificationYoIDURL(NotificationType.ActionLink_Verify_Distribution),
                    Items =
                    [
                      new NotificationActionLinkVerifyItem
                      {
                        Title = opportunity.Title,
                        DateStart = opportunity.DateStart,
                        DateEnd = opportunity.DateEnd,
                        URL = link.ShortURL,
                        ZltoReward = opportunity.ZltoReward,
                        YomaReward = opportunity.YomaReward
                      }
                    ]
                  };

                  break;

                default:
                  throw new InvalidOperationException($"Invalid / unsupported entity type of '{entityType}'");
              }

              notificationType = NotificationType.ActionLink_Verify_Approval_Approved;
              break;

            case LinkStatus.Inactive:
              if (link.Status == LinkStatus.Inactive) return link.ToLinkInfo(false);

              if (!Statuses_DeActivatable.Contains(link.Status))
                throw new ValidationException($"Link can not be deactivated (current status '{link.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

              if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

              notificationType = NotificationType.ActionLink_Verify_Approval_Requested;
              break;

            case LinkStatus.Declined:
              if (link.Status == LinkStatus.Declined) return link.ToLinkInfo(false);

              if (!Statuses_Declinable.Contains(link.Status))
                throw new ValidationException($"Link can not be deactivated (current status '{link.Status}'). Required state '{string.Join(" / ", Statuses_Declinable)}'");

              if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

              link.CommentApproval = request.Comment;

              notificationType = NotificationType.ActionLink_Verify_Approval_Declined;
              break;

            case LinkStatus.Deleted:
              if (link.Status == LinkStatus.Deleted) return link.ToLinkInfo(false);

              if (!Statuses_CanDelete.Contains(link.Status))
                throw new ValidationException($"Link can not be deactivated (current status '{link.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");
              break;

            default:
              throw new InvalidOperationException($"Invalid / unsupported status of '{request.Status}'");
          }
          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported action of '{action}'");
      }

      link.StatusId = _linkStatusService.GetByName(request.Status.ToString()).Id;
      link.Status = request.Status;

      link = await _linkRepository.Update(link);

      if (notificationDataDistributionList != null) await SendNotification_ActionLinkVerifyDistributionList(link, notificationDataDistributionList);
      if (notificationType.HasValue) await SendNotification(link, notificationType.Value);

      return link.ToLinkInfo(false);
    }
    #endregion

    #region Private Members
    private Link GetById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _linkRepository.Query().SingleOrDefault(o => o.Id == id)
       ?? throw new EntityNotFoundException($"Link with id '{id}' does not exist");

      return result;
    }

    private void EnsureOrganizationAuthorization(Link link)
    {
      var entityType = Enum.Parse<LinkEntityType>(link.EntityType);

      switch (entityType)
      {
        case LinkEntityType.Opportunity:
          if (!link.OpportunityId.HasValue || !link.OpportunityOrganizationId.HasValue)
            throw new DataInconsistencyException("Opportunity expected");

          _organizationService.IsAdmin(link.OpportunityOrganizationId.Value, true);
          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported entity type of '{entityType}'");
      }
    }

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

    private Opportunity.Models.Opportunity ValidateAndInitializeOpportunity(LinkRequestCreateBase request, Link item, bool publishedOrExpiredOnly, bool ensureOrganizationAuthorization)
    {
      var opportunity = _opportunityService.GetById(request.EntityId, false, true, ensureOrganizationAuthorization);

      if (publishedOrExpiredOnly)
      {
        var (found, message) = opportunity.PublishedOrExpired();

        if (!found)
        {
          ArgumentException.ThrowIfNullOrEmpty(message);
          throw new EntityNotFoundException(message);
        }
      }

      item.OpportunityId = opportunity.Id;
      item.OpportunityOrganizationId = opportunity.OrganizationId;
      item.OpportunityTitle = opportunity.Title;
      request.Name ??= opportunity.Title.RemoveSpecialCharacters();
      item.Name = request.Name;
      return opportunity;
    }

    private Link LinkFromRequest(LinkRequestCreateBase request, LinkStatus status, bool ensureOrganizationAuthorization)
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var item = new Link
      {
        Id = Guid.NewGuid(),
        Description = request.Description,
        EntityType = request.EntityType.ToString(),
        Action = request.Action.ToString(),
        StatusId = _linkStatusService.GetByName(status.ToString()).Id,
        Status = status,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id,
      };

      return item;
    }

    private async Task<Link> GenerateShortLinkAndCreate(LinkRequestCreateBase request, Link item)
    {
      var responseShortLink = await _shortLinkProviderClient.CreateShortLink(new ShortLinkRequest
      {
        Type = request.EntityType,
        Action = request.Action,
        Title = item.Name,
        URL = item.URL
      });

      item.ShortURL = responseShortLink.Link;

      return await _linkRepository.Create(item);
    }

    private async Task<LinkInfo> LogUsage(Link link)
    {
      AssertActive(link);

      var action = Enum.Parse<LinkAction>(link.Action);
      LinkUsageLog? usageLog = null;
      User? user = null;

      switch (action)
      {
        case LinkAction.Share:
          //user context optional; only tracked provided executed with context
          if (!HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor)) return link.ToLinkInfo(false);

          user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

          usageLog = _linkUsageLogRepository.Query().SingleOrDefault(o => o.LinkId == link.Id && o.UserId == user.Id);
          if (usageLog != null) return link.ToLinkInfo(false);
          break;

        case LinkAction.Verify:
          //user context required
          if (!HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor)) throw new InvalidOperationException($"User context required for link with action '{action}'");

          user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

          usageLog = _linkUsageLogRepository.Query().SingleOrDefault(o => o.LinkId == link.Id && o.UserId == user.Id);
          if (usageLog != null) throw new ValidationException($"This link has already been used / claimed on '{usageLog.DateCreated:yyyy-MM-dd HH:mm:ss}'");

          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported action of '{action}'");
      }

      if (link.LockToDistributionList == true)
      {
        if (link.DistributionList == null)
          throw new DataInconsistencyException("Link is locked to a distribution list but no distribution list is defined");

        var distributionList = ParseDistributionList(link);

        if (distributionList == null || distributionList.Count == 0)
          throw new DataInconsistencyException("Link is locked to a distribution list but no distribution list is defined");

        var isAuthorized = (!string.IsNullOrEmpty(user.Email) && distributionList.Contains(user.Email, StringComparer.InvariantCultureIgnoreCase)) ||
                       (!string.IsNullOrEmpty(user.PhoneNumber) && distributionList.Contains(user.PhoneNumber));

        if (!isAuthorized)
          throw new SecurityException("Unauthorized: You don't have access because this link is limited to specific users");
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        usageLog = await _linkUsageLogRepository.Create(new LinkUsageLog
        {
          LinkId = link.Id,
          UserId = user.Id,
        });

        link.UsagesTotal = (link.UsagesTotal ?? 0) + 1;
        if (link.UsagesLimit.HasValue && link.UsagesTotal >= link.UsagesLimit)
        {
          link.StatusId = _linkStatusService.GetByName(LinkStatus.LimitReached.ToString()).Id;
          link.Status = LinkStatus.LimitReached;
        }
        link = await _linkRepository.Update(link);

        scope.Complete();
      });

      return link.ToLinkInfo(false);
    }

    public List<string>? ParseDistributionList(Link link)
    {
      if (link.DistributionList == null) return null;

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return JsonConvert.DeserializeObject<List<string>>(link.DistributionList);

      var cacheKey = CacheHelper.GenerateKey<Link>(nameof(link.DistributionList), link.Id);

      var result = _memoryCache.GetOrCreate(cacheKey, entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        return JsonConvert.DeserializeObject<List<string>>(link.DistributionList);
      }) ?? throw new InvalidOperationException("Failed to retrieve cached distribution list");

      return result;
    }


    private async Task SendNotification_ActionLinkVerifyDistributionList(Link link, NotificationActionLinkVerify data)
    {
      var distributionList = string.IsNullOrEmpty(link.DistributionList) ? null : JsonConvert.DeserializeObject<List<string>>(link.DistributionList);
      if (distributionList == null) return;

      try
      {
        var recipients = distributionList.Select(item =>
        {
          var isEmail = item.Contains('@');
          return new NotificationRecipient
          {
            Email = isEmail ? item : null,
            EmailConfirmed = isEmail ? true : null, //assume confirmed for action link verify distribution
            PhoneNumber = isEmail ? null : item,
            PhoneNumberConfirmed = isEmail ? null : true, //assume confirmed for action link verify distribution
            Username = item
          };
        }).ToList();

        await _notificationDeliveryService.Send(NotificationType.ActionLink_Verify_Distribution, recipients, data);

        _logger.LogInformation("Successfully sent notification");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
      }
    }

    private async Task SendNotification(Link link, NotificationType type)
    {
      try
      {
        List<NotificationRecipient>? recipients = null;

        var dataLink = new NotificationActionLinkVerifyApprovalItem { Name = link.Name, EntityType = link.EntityType };

        switch (type)
        {
          case NotificationType.ActionLink_Verify_Approval_Requested:
            //send notification to super administrators
            var superAdmins = await _identityProviderClient.ListByRole(Core.Constants.Role_Admin);
            recipients = superAdmins?.Select(o => new NotificationRecipient
            {
              Username = o.Username,
              PhoneNumber = o.PhoneNumber,
              PhoneNumberConfirmed = o.PhoneNumberVerified,
              Email = o.Email,
              EmailConfirmed = o.EmailVerified,
              DisplayName = o.ToDisplayName()
            }).ToList();

            dataLink.Comment = link.CommentApproval;
            dataLink.URL = _notificationURLFactory.ActionLinkVerifyApprovalItemUrl(type, null);

            break;

          case NotificationType.ActionLink_Verify_Approval_Approved:
          case NotificationType.ActionLink_Verify_Approval_Declined:
            var entityType = Enum.Parse<LinkEntityType>(link.EntityType, true);
            switch (entityType)
            {
              case LinkEntityType.Opportunity:
                if (!link.OpportunityOrganizationId.HasValue)
                  throw new InvalidOperationException("Opportunity organization details expected");

                //send notification to organization administrators
                var organization = _organizationService.GetById(link.OpportunityOrganizationId.Value, true, false, false);

                recipients = organization.Administrators?.Select(o => new NotificationRecipient
                {
                  Username = o.Username,
                  PhoneNumber = o.PhoneNumber,
                  PhoneNumberConfirmed = o.PhoneNumberConfirmed,
                  Email = o.Email,
                  EmailConfirmed = o.EmailConfirmed,
                  DisplayName = o.DisplayName
                }).ToList();

                dataLink.Comment = link.CommentApproval;
                dataLink.URL = _notificationURLFactory.ActionLinkVerifyApprovalItemUrl(type, organization.Id);
                break;

              default:
                throw new InvalidOperationException($"Invalid / unsupported entity type of '{entityType}'");
            }

            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported");
        }

        var data = new NotificationActionLinkVerifyApproval
        {
          Links = [dataLink]
        };

        await _notificationDeliveryService.Send(type, recipients, data);

        _logger.LogInformation("Successfully sent notification");

      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
      }
    }
    #endregion
  }
}
