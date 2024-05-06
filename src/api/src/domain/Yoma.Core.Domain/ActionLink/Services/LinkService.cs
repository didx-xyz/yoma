using FluentValidation;
using Flurl;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.ActionLink.Extensions;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.ActionLink.Validators;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;

namespace Yoma.Core.Domain.ActionLink.Services
{
  public class LinkService : ILinkService
  {
    #region Class Variables
    private readonly ILogger<LinkService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IShortLinkProviderClient _shortLinkProviderClient;
    private readonly IUserService _userService;
    private readonly IOrganizationService _organizationService;
    private readonly IOpportunityService _opportunityService;
    private readonly ILinkStatusService _linkStatusService;
    private readonly IRepositoryBatched<Link> _linkRepository;
    private readonly IRepository<LinkUsageLog> _linkUsageLogRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly IEmailProviderClient _emailProviderClient;

    private readonly LinkRequestCreateValidatorShare _linkRequestCreateValidatorShare;
    private readonly LinkRequestCreateValidatorVerify _linkRequestCreateValidatorVerify;
    private readonly LinkSearchFilterValidator _linkSearchFilterValidator;

    private static readonly LinkStatus[] Statuses_Activatable = [LinkStatus.Inactive];
    private static readonly LinkStatus[] Statuses_DeActivatable = [LinkStatus.Active];
    #endregion

    #region Constructor
    public LinkService(ILogger<LinkService> logger,
      IOptions<AppSettings> appSettings,
      IHttpContextAccessor httpContextAccessor,
      IShortLinkProviderClientFactory shortLinkProviderClientFactory,
      IUserService userService,
      IOrganizationService organizationService,
      ILinkStatusService linkStatusService,
      IOpportunityService opportunityService,
      IRepositoryBatched<Link> linkRepository,
      IRepository<LinkUsageLog> linkUsageLogRepository,
      IExecutionStrategyService executionStrategyService,
      IEmailProviderClientFactory emailProviderClientFactory,
      LinkRequestCreateValidatorShare linkRequestCreateValidatorShare,
      LinkRequestCreateValidatorVerify linkRequestCreateValidatorVerify,
      LinkSearchFilterValidator linkSearchFilterValidator)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _httpContextAccessor = httpContextAccessor;
      _shortLinkProviderClient = shortLinkProviderClientFactory.CreateClient();
      _userService = userService;
      _organizationService = organizationService;
      _opportunityService = opportunityService;
      _linkStatusService = linkStatusService;
      _linkRepository = linkRepository;
      _linkUsageLogRepository = linkUsageLogRepository;
      _executionStrategyService = executionStrategyService;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _linkRequestCreateValidatorShare = linkRequestCreateValidatorShare;
      _linkRequestCreateValidatorVerify = linkRequestCreateValidatorVerify;
      _linkSearchFilterValidator = linkSearchFilterValidator;
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
          filter.Organizations = filter.Organizations.Distinct().ToList();
          _organizationService.IsAdminsOf(filter.Organizations, true);
        }
        else
          filter.Organizations = _organizationService.ListAdminsOf(false).Select(o => o.Id).ToList();
      }

      //entity type
      var query = _linkRepository.Query().Where(o => o.EntityType == filter.EntityType.ToString());

      //action
      if (filter.Action.HasValue)
        query = query.Where(o => o.Action == filter.Action.ToString());

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = filter.Statuses.Distinct().ToList();
        var statusIds = filter.Statuses.Select(o => _linkStatusService.GetByName(o.ToString())).Select(o => o.Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      switch (filter.EntityType)
      {
        case LinkEntityType.Opportunity:
          // opportunities
          if (filter.Entities != null && filter.Entities.Count != 0)
          {
            filter.Entities = filter.Entities.Distinct().ToList();
            query = query.Where(o => filter.Entities.Contains(o.OpportunityId!.Value));
          }

          // organizations
          if (filter.Organizations != null && filter.Organizations.Count != 0)
          {
            filter.Organizations = filter.Organizations.Distinct().ToList();
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

      result.Items = query.ToList().Select(o => o.ToLinkInfo(false)).ToList();
      return result;
    }

    public async Task<LinkInfo> GetOrCreateShare(LinkRequestCreateShare request, bool publishedOrExpiredOnly, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      await _linkRequestCreateValidatorShare.ValidateAndThrowAsync(request);

      var item = LinkFromRequest(request, ensureOrganizationAuthorization);

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

    public async Task<LinkInfo> CreateVerify(LinkRequestCreateVerify request, bool publishedOrExpiredOnly, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      await _linkRequestCreateValidatorVerify.ValidateAndThrowAsync(request);

      if (request.DistributionList != null)
      {
        request.DistributionList = request.DistributionList.Distinct().ToList();
        //with LockToDistributionList, DistributionList is required and usage limit is set to the count of the distribution list
        if (request.LockToDistributionList == true) request.UsagesLimit = request.DistributionList.Count;
      }

      if (!request.UsagesLimit.HasValue && !request.DateEnd.HasValue)
        throw new ValidationException($"Either a usage limit or an end date is required");

      var item = LinkFromRequest(request, ensureOrganizationAuthorization);
      item.UsagesLimit = request.UsagesLimit;
      item.DateEnd = request.DateEnd.HasValue ? request.DateEnd.Value.ToEndOfDay() : null;
      item.DistributionList = request.DistributionList == null ? null : JsonConvert.SerializeObject(request.DistributionList);
      item.LockToDistributionList = request.LockToDistributionList;

      EmailActionLinkVerify? data = null;
      switch (request.EntityType)
      {
        case LinkEntityType.Opportunity:
          var opportunity = ValidateAndInitializeOpportunity(request, item, publishedOrExpiredOnly, ensureOrganizationAuthorization);

          if (!opportunity.VerificationEnabled || opportunity.VerificationMethod != VerificationMethod.Manual)
            throw new ValidationException($"Link cannot be created as the opportunity '{opportunity.Title}' does not support manual verification");

          if (!opportunity.Published)
            throw new ValidationException($"Link cannot be created as the opportunity '{opportunity.Title}' has not been published");

          item.URL = opportunity.YomaInstantVerifyURL(_appSettings.AppBaseURL).AppendPathSegment(item.Id.ToString());

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
          var itemExisting = _linkRepository.Query()
            .Where(o => o.EntityType == item.EntityType && o.Action == item.Action && o.OpportunityId == item.OpportunityId && o.Name.ToLower() == item.Name.ToLower()).SingleOrDefault();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

          if (itemExisting != null)
            throw new ValidationException($"Link with name '{item.Name}' already exists for the opportunity");

          if (request.DistributionList == null) break;

          data = new EmailActionLinkVerify
          {
            Items = [
              new()
              {
                OrganizationName = opportunity.OrganizationName,
                Title = opportunity.Title,
                DateStart = opportunity.DateStart,
                DateEnd = opportunity.DateEnd,
                URL = item.URL,
                ZltoReward = opportunity.ZltoReward,
                YomaReward = opportunity.YomaReward
              }
              ]
          };

          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported entity type of '{request.EntityType}'");
      }

      item = await GenerateShortLinkAndCreate(request, item);

      if (request.DistributionList != null)
      {
        try
        {
          if (data == null) throw new InvalidOperationException("Email data not initialized");

          var recipients = request.DistributionList.Select(o => new EmailRecipient { Email = o }).ToList();
          await _emailProviderClient.Send(EmailType.ActionLink_Verify_Created, recipients, data);
          _logger.LogInformation("Successfully send '{emailType}' email", EmailType.ActionLink_Verify_Created);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to send '{emailType}' email", EmailType.ActionLink_Verify_Created);
        }
      }

      return item.ToLinkInfo(request.IncludeQRCode);
    }

    public async Task<LinkInfo> LogUsage(Guid id)
    {
      var link = GetById(id);

      return await LogUsage(link);
    }

    public async Task<LinkInfo> UpdateStatus(Guid id, LinkStatus status, bool ensureOrganizationAuthorization)
    {
      var link = GetById(id);
      EnsureOrganizationAuthorization(link);

      var action = Enum.Parse<LinkAction>(link.Action);

      switch (action)
      {
        case LinkAction.Share:
          throw new ValidationException($"Link with action '{link.Action}' status can not be changed and remains active indefinitely");

        case LinkAction.Verify:
          switch (status)
          {
            case LinkStatus.Active:
              if (link.Status == LinkStatus.Active) return link.ToLinkInfo(false);

              if (!Statuses_Activatable.Contains(link.Status))
                throw new ValidationException($"Link can not be activated (current status '{link.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

              //ensure not expired but not yet flagged by background service
              if (link.DateEnd.HasValue && link.DateEnd.Value <= DateTimeOffset.UtcNow)
                throw new ValidationException($"Link cannot be activated because its end date ('{link.DateEnd:yyyy-MM-dd}') is in the past");

              link.StatusId = _linkStatusService.GetByName(LinkStatus.Active.ToString()).Id;
              link.Status = LinkStatus.Active;
              break;

            case LinkStatus.Inactive:
              if (link.Status == LinkStatus.Inactive) return link.ToLinkInfo(false);

              if (!Statuses_DeActivatable.Contains(link.Status))
                throw new ValidationException($"Link can not be deactivated (current status '{link.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

              link.StatusId = _linkStatusService.GetByName(LinkStatus.Inactive.ToString()).Id;
              link.Status = LinkStatus.Inactive;
              break;

            default:
              throw new InvalidOperationException($"Invalid / unsupported status of '{status}'");
          }
          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported action of '{action}'");
      }

      link = await _linkRepository.Update(link);
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

    private Link LinkFromRequest(LinkRequestCreateBase request, bool ensureOrganizationAuthorization)
    {
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var item = new Link
      {
        Id = Guid.NewGuid(),
        Description = request.Description,
        EntityType = request.EntityType.ToString(),
        Action = request.Action.ToString(),
        Status = LinkStatus.Active,
        StatusId = _linkStatusService.GetByName(LinkStatus.Active.ToString()).Id,
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

          user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

          usageLog = _linkUsageLogRepository.Query().SingleOrDefault(o => o.LinkId == link.Id && o.UserId == user.Id);
          if (usageLog != null) return link.ToLinkInfo(false);
          break;

        case LinkAction.Verify:
          //user context required
          if (!HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor)) throw new InvalidOperationException($"User context required for link with action '{action}'");

          user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

          usageLog = _linkUsageLogRepository.Query().SingleOrDefault(o => o.LinkId == link.Id && o.UserId == user.Id);
          if (usageLog != null) throw new ValidationException($"This link has already been claimed or used on '{usageLog.DateCreated:yyyy-MM-dd HH:mm:ss}'");

          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported action of '{action}'");
      }

      if (link.LockToDistributionList == true)
      {
        if (link.DistributionList == null)
          throw new DataInconsistencyException("Link is locked to a distribution list but no distribution list is defined");

        var emails = JsonConvert.DeserializeObject<List<string>>(link.DistributionList);

        if (emails == null || emails.Count == 0)
          throw new DataInconsistencyException("Link is locked to a distribution list but no distribution list is defined");

        if (!emails.Contains(user.Email, StringComparer.InvariantCultureIgnoreCase))
          throw new SecurityException("Unauthorized");
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
        if (link.UsagesLimit.HasValue && link.UsagesTotal == link.UsagesLimit) link.Status = LinkStatus.LimitReached;
        link = await _linkRepository.Update(link);

        scope.Complete();
      });

      return link.ToLinkInfo(false);
    }
    #endregion
  }
}
