using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.MyOpportunity.Extensions;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Services
{
  public class MyOpportunityService : IMyOpportunityService
  {
    #region Class Variables
    private readonly ILogger<MyOpportunityService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserService _userService;
    private readonly IOrganizationService _organizationService;
    private readonly IOpportunityService _opportunityService;
    private readonly IMyOpportunityActionService _myOpportunityActionService;
    private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
    private readonly IOpportunityStatusService _opportunityStatusService;
    private readonly IOrganizationStatusService _organizationStatusService;
    private readonly IBlobService _blobService;
    private readonly ISSICredentialService _ssiCredentialService;
    private readonly IRewardService _rewardService;
    private readonly ILinkService _linkService;
    private readonly IEmailURLFactory _emailURLFactory;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly MyOpportunitySearchFilterValidator _myOpportunitySearchFilterValidator;
    private readonly MyOpportunityRequestValidatorVerify _myOpportunityRequestValidatorVerify;
    private readonly MyOpportunityRequestValidatorVerifyFinalize _myOpportunityRequestValidatorVerifyFinalize;
    private readonly MyOpportunityRequestValidatorVerifyFinalizeBatch _myOpportunityRequestValidatorVerifyFinalizeBatch;
    private readonly IRepositoryBatchedWithNavigation<Models.MyOpportunity> _myOpportunityRepository;
    private readonly IRepository<MyOpportunityVerification> _myOpportunityVerificationRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public MyOpportunityService(ILogger<MyOpportunityService> logger,
        IOptions<AppSettings> appSettings,
        IHttpContextAccessor httpContextAccessor,
        IUserService userService,
        IOrganizationService organizationService,
        IOpportunityService opportunityService,
        IMyOpportunityActionService myOpportunityActionService,
        IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
        IOpportunityStatusService opportunityStatusService,
        IOrganizationStatusService organizationStatusService,
        IBlobService blobService,
        ISSICredentialService ssiCredentialService,
        IRewardService rewardService,
        ILinkService linkService,
        IEmailURLFactory emailURLFactory,
        IEmailProviderClientFactory emailProviderClientFactory,
        MyOpportunitySearchFilterValidator myOpportunitySearchFilterValidator,
        MyOpportunityRequestValidatorVerify myOpportunityRequestValidatorVerify,
        MyOpportunityRequestValidatorVerifyFinalize myOpportunityRequestValidatorVerifyFinalize,
        MyOpportunityRequestValidatorVerifyFinalizeBatch myOpportunityRequestValidatorVerifyFinalizeBatch,
        IRepositoryBatchedWithNavigation<Models.MyOpportunity> myOpportunityRepository,
        IRepository<MyOpportunityVerification> myOpportunityVerificationRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _httpContextAccessor = httpContextAccessor;
      _userService = userService;
      _organizationService = organizationService;
      _opportunityService = opportunityService;
      _myOpportunityActionService = myOpportunityActionService;
      _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
      _opportunityStatusService = opportunityStatusService;
      _organizationStatusService = organizationStatusService;
      _blobService = blobService;
      _ssiCredentialService = ssiCredentialService;
      _rewardService = rewardService;
      _linkService = linkService;
      _emailURLFactory = emailURLFactory;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _myOpportunitySearchFilterValidator = myOpportunitySearchFilterValidator;
      _myOpportunityRequestValidatorVerify = myOpportunityRequestValidatorVerify;
      _myOpportunityRequestValidatorVerifyFinalize = myOpportunityRequestValidatorVerifyFinalize;
      _myOpportunityRequestValidatorVerifyFinalizeBatch = myOpportunityRequestValidatorVerifyFinalizeBatch;
      _myOpportunityRepository = myOpportunityRepository;
      _myOpportunityVerificationRepository = myOpportunityVerificationRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public Models.MyOpportunity GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _myOpportunityRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id)
          ?? throw new EntityNotFoundException($"{nameof(Models.MyOpportunity)} with id '{id}' does not exist");

      if (ensureOrganizationAuthorization)
        _organizationService.IsAdmin(result.OrganizationId, true);

      if (includeComputed)
      {
        result.UserPhotoURL = GetBlobObjectURL(result.UserPhotoStorageType, result.UserPhotoKey);
        result.OrganizationLogoURL = GetBlobObjectURL(result.OrganizationLogoStorageType, result.OrganizationLogoKey);
        result.Verifications?.ForEach(v => v.FileURL = GetBlobObjectURL(v.FileStorageType, v.FileKey));
      }

      return result;
    }

    public List<MyOpportunitySearchCriteriaOpportunity> ListMyOpportunityVerificationSearchCriteriaOpportunity(List<Guid>? organizations,
        List<VerificationStatus>? verificationStatuses,
        bool ensureOrganizationAuthorization)
    {
      var query = _myOpportunityRepository.Query(false);

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      query = query.Where(o => o.ActionId == actionVerificationId);

      //organizations
      if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
      {
        //ensure the organization admin is the admin of the specified organizations
        if (organizations != null && organizations.Count != 0)
        {
          organizations = organizations.Distinct().ToList();
          _organizationService.IsAdminsOf(organizations, true);
        }
        else
          //ensure search only spans authorized organizations
          organizations = _organizationService.ListAdminsOf(false).Select(o => o.Id).ToList();
      }

      if (organizations != null && organizations.Count != 0)
        query = query.Where(o => organizations.Contains(o.OrganizationId));

      if (verificationStatuses != null && verificationStatuses.Count != 0)
      {
        verificationStatuses = verificationStatuses.Distinct().ToList();
        var verificationStatusIds = new List<Guid>();
        verificationStatuses.ForEach(o => verificationStatusIds.Add(_myOpportunityVerificationStatusService.GetByName(o.ToString()).Id));
        query = query.Where(o => o.VerificationStatusId.HasValue && verificationStatusIds.Contains(o.VerificationStatusId.Value));
      }

      var results = query
          .GroupBy(o => o.OpportunityId)
          .Select(group => new MyOpportunitySearchCriteriaOpportunity
          {
            Id = group.Key,
            Title = group.First().OpportunityTitle
          })
          .ToList();

      results.ForEach(o => o.Title = o.Title.RemoveSpecialCharacters());
      results = [.. results.OrderBy(o => o.Title)];

      return results;
    }

    public MyOpportunityResponseVerify GetVerificationStatus(Guid opportunityId)
    {
      var opportunity = _opportunityService.GetById(opportunityId, true, true, false);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId);
      if (myOpportunity == null) return new MyOpportunityResponseVerify { Status = VerificationStatus.None };

      if (!myOpportunity.VerificationStatus.HasValue)
        throw new InvalidOperationException($"Verification status expected for 'my' opportunity with id '{myOpportunity.Id}'");

      return new MyOpportunityResponseVerify { Status = myOpportunity.VerificationStatus.Value, Comment = myOpportunity.CommentVerification };
    }

    public MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      //filter validated by SearchAdmin

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var filterInternal = new MyOpportunitySearchFilterAdmin
      {
        UserId = user.Id,
        Action = filter.Action,
        VerificationStatuses = filter.VerificationStatuses,
        TotalCountOnly = filter.TotalCountOnly,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      };

      return Search(filterInternal, false);
    }

    public MyOpportunitySearchResults Search(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _myOpportunitySearchFilterValidator.ValidateAndThrow(filter);

      var actionId = _myOpportunityActionService.GetByName(filter.Action.ToString()).Id;
      var opportunityStatusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var opportunityStatusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;

      var query = _myOpportunityRepository.Query(true);

      //organization
      if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
      {
        //ensure the organization admin is the admin of the specified organizations
        if (filter.Organizations != null && filter.Organizations.Count != 0)
        {
          filter.Organizations = filter.Organizations.Distinct().ToList();
          _organizationService.IsAdminsOf(filter.Organizations, true);
        }
        else
          //ensure search only spans authorized organizations
          filter.Organizations = _organizationService.ListAdminsOf(false).Select(o => o.Id).ToList();
      }

      if (filter.Organizations != null && filter.Organizations.Count != 0)
        query = query.Where(o => filter.Organizations.Contains(o.OrganizationId));

      //action (required)
      query = query.Where(o => o.ActionId == actionId);

      //userId
      if (filter.UserId.HasValue)
        query = query.Where(o => o.UserId == filter.UserId);

      //opportunity
      if (filter.Opportunity.HasValue)
        query = query.Where(o => o.OpportunityId == filter.Opportunity);

      //valueContains (opportunities and users) 
      if (!string.IsNullOrEmpty(filter.ValueContains))
      {
        var predicate = PredicateBuilder.False<Models.MyOpportunity>();

        var matchedOpportunityIds = _opportunityService.Contains(filter.ValueContains, false).Select(o => o.Id).ToList();
        predicate = predicate.Or(o => matchedOpportunityIds.Contains(o.OpportunityId));

        var matchedUserIds = _userService.Contains(filter.ValueContains, false).Select(o => o.Id).ToList();
        predicate = predicate.Or(o => matchedUserIds.Contains(o.UserId));

        query = query.Where(predicate);
      }

      switch (filter.Action)
      {
        case Action.Saved:
        case Action.Viewed:
          //published: relating to active opportunities (irrespective of started) that relates to active organizations
          query = query.Where(o => o.OpportunityStatusId == opportunityStatusActiveId);
          query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);
          query = query.OrderByDescending(o => o.DateModified).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results
          break;

        case Action.Verification:
          if (filter.VerificationStatuses == null || filter.VerificationStatuses.Count == 0)
            throw new ArgumentNullException(nameof(filter), "One or more verification status(es) required");
          filter.VerificationStatuses = filter.VerificationStatuses.Distinct().ToList();

          var predicate = PredicateBuilder.False<Models.MyOpportunity>();

          foreach (var status in filter.VerificationStatuses)
          {
            var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(status.ToString()).Id;

            predicate = status switch
            {
              //items that can be completed, thus started opportunities (active) or expired opportunities that relates to active organizations
              VerificationStatus.Pending =>
                  predicate.Or(o => o.VerificationStatusId == verificationStatusId && ((o.OpportunityStatusId == opportunityStatusActiveId && o.DateStart <= DateTimeOffset.UtcNow) ||
                  o.OpportunityStatusId == opportunityStatusExpiredId) && o.OrganizationStatusId == organizationStatusActiveId),

              //all, irrespective of related opportunity and organization status
              VerificationStatus.Completed => predicate.Or(o => o.VerificationStatusId == verificationStatusId),

              //all, irrespective of related opportunity and organization status
              VerificationStatus.Rejected => predicate.Or(o => o.VerificationStatusId == verificationStatusId),

              _ => throw new InvalidOperationException($"Unknown / unsupported '{nameof(filter.VerificationStatuses)}' of '{status}'"),
            };
          }

          query = query.Where(predicate);
          query = query.OrderByDescending(o => o.DateModified).ThenByDescending(o => o.DateCompleted).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

          break;

        default:
          throw new InvalidOperationException($"Unknown / unsupported '{nameof(filter.Action)}' of '{filter.Action}'");
      }

      var result = new MyOpportunitySearchResults();

      if (filter.TotalCountOnly)
      {
        result.TotalCount = query.Count();
        return result;
      }

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      var items = query.ToList();
      items.ForEach(o =>
      {
        o.UserPhotoURL = GetBlobObjectURL(o.UserPhotoStorageType, o.UserPhotoKey);
        o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoStorageType, o.OrganizationLogoKey);
        o.Verifications?.ForEach(v => v.FileURL = GetBlobObjectURL(v.FileStorageType, v.FileKey));
      });
      result.Items = items.Select(o => o.ToInfo()).ToList();

      result.Items.ForEach(o => SetParticipantCounts(o));
      return result;
    }

    public async Task PerformActionViewed(Guid opportunityId)
    {
      //published opportunities (irrespective of started)
      var opportunity = _opportunityService.GetById(opportunityId, false, true, false);
      if (!opportunity.Published)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be actioned"));

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionViewedId = _myOpportunityActionService.GetByName(Action.Viewed.ToString()).Id;

      var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionViewedId);
      if (myOpportunity == null)
      {
        myOpportunity = new Models.MyOpportunity
        {
          UserId = user.Id,
          OpportunityId = opportunity.Id,
          ActionId = actionViewedId
        };
        await _myOpportunityRepository.Create(myOpportunity);
      }
      else
        await _myOpportunityRepository.Update(myOpportunity); //update DateModified
    }

    public bool ActionedSaved(Guid opportunityId)
    {
      //published opportunities (irrespective of started)
      var opportunity = _opportunityService.GetById(opportunityId, false, true, false);
      if (!opportunity.Published) return false;

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;

      var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);

      return myOpportunity != null;
    }

    public async Task PerformActionSaved(Guid opportunityId)
    {
      //published opportunities (irrespective of started)
      var opportunity = _opportunityService.GetById(opportunityId, false, true, false);
      if (!opportunity.Published)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be actioned"));

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;

      var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);
      if (myOpportunity == null)
      {
        myOpportunity = new Models.MyOpportunity
        {
          UserId = user.Id,
          OpportunityId = opportunity.Id,
          ActionId = actionSavedId
        };
        await _myOpportunityRepository.Create(myOpportunity);
      }
      else
        await _myOpportunityRepository.Update(myOpportunity); //update DateModified
    }

    public async Task PerformActionSavedRemove(Guid opportunityId)
    {
      //published opportunities (irrespective of started)
      var opportunity = _opportunityService.GetById(opportunityId, false, true, false);
      if (!opportunity.Published)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be actioned"));

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;
      var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);

      if (myOpportunity == null) return; //not saved

      await _myOpportunityRepository.Delete(myOpportunity);
    }

    public async Task PerformActionSendForVerificationManual(Guid userId, Guid opportunityId, MyOpportunityRequestVerify request, bool overridePending)
    {
      var user = _userService.GetById(userId, false, false);

      request.OverridePending = overridePending;

      await PerformActionSendForVerificationManual(user, opportunityId, request);
    }

    public async Task PerformActionSendForVerificationManual(Guid opportunityId, MyOpportunityRequestVerify request)
    {
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      await PerformActionSendForVerificationManual(user, opportunityId, request);
    }

    public async Task PerformActionInstantVerificationManual(Guid linkId)
    {
      var link = _linkService.GetById(linkId, false, false);

      link.AssertLinkInstantVerify();

      //ensure link is still usable
      _linkService.AssertActive(link.Id);

      //send for verification
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var opportunity = _opportunityService.GetById(link.EntityId, true, true, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        await _linkService.LogUsage(link.Id);

        var request = new MyOpportunityRequestVerify { InstantVerification = true };
        await PerformActionSendForVerificationManual(user, link.EntityId, request);

        await FinalizeVerificationManual(user, opportunity, VerificationStatus.Completed, true, "Auto-verification");

        scope.Complete();
      });
    }

    public async Task PerformActionSendForVerificationManualDelete(Guid opportunityId)
    {
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      //opportunity can be updated whilst active, and can result in disabling support for verification; allow deletion provided verification is pending even if no longer supported
      //similar logic provided sent for verification prior to update that resulted in disabling support for verification i.e. enabled, method, types, 'published' status etc.
      var opportunity = _opportunityService.GetById(opportunityId, true, true, false);

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var myOpportunity = _myOpportunityRepository.Query(true).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
          ?? throw new ValidationException($"Opportunity '{opportunity.Title}' has not been sent for verification for user '{user.Email}'");

      if (myOpportunity.VerificationStatus != VerificationStatus.Pending)
        throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

      var itemsExisting = new List<MyOpportunityVerification>();
      var itemsExistingDeleted = new List<MyOpportunityVerification>();
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

          var items = myOpportunity.Verifications?.Where(o => o.FileId.HasValue).ToList();
          if (items != null)
          {
            itemsExisting.AddRange(items);
            foreach (var item in itemsExisting)
            {
              if (!item.FileId.HasValue)
                throw new InvalidOperationException("File id expected");
              item.File = await _blobService.Download(item.FileId.Value);
            }
          }

          //delete existing items in blob storage and db
          foreach (var item in itemsExisting)
          {
            if (!item.FileId.HasValue)
              throw new InvalidOperationException("File expected");

            await _myOpportunityVerificationRepository.Delete(item);
            await _blobService.Delete(item.FileId.Value);
            itemsExistingDeleted.Add(item);
          }

          await _myOpportunityRepository.Delete(myOpportunity);

          scope.Complete();
        });
      }
      catch //roll back
      {
        //re-upload existing items to blob storage
        foreach (var item in itemsExistingDeleted)
        {
          if (!item.FileId.HasValue || item.File == null)
            throw new InvalidOperationException("File expected");

          await _blobService.Create(item.FileId.Value, item.File);
        }

        throw;
      }
    }

    public async Task<MyOpportunityResponseVerifyFinalizeBatch> FinalizeVerificationManual(MyOpportunityRequestVerifyFinalizeBatch request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _myOpportunityRequestValidatorVerifyFinalizeBatch.ValidateAndThrowAsync(request);

      request.Items = request.Items.GroupBy(i => new { i.OpportunityId, i.UserId }).Select(g => g.First()).ToList();

      User? user = null;
      Opportunity.Models.Opportunity? opportunity = null;
      var resultItems = new List<MyOpportunityResponseVerifyFinalizeBatchItem>();
      foreach (var item in request.Items)
      {
        try
        {
          user = _userService.GetById(item.UserId, false, false);
          opportunity = _opportunityService.GetById(item.OpportunityId, true, true, false);

          await FinalizeVerificationManual(user, opportunity, request.Status, false, request.Comment);

          var successItem = new MyOpportunityResponseVerifyFinalizeBatchItem
          {
            OpportunityId = item.OpportunityId,
            OpportunityTitle = opportunity.Title,
            UserId = item.UserId,
            UserDisplayName = user.DisplayName,
            Failure = null
          };
          resultItems.Add(successItem);
        }
        catch (Exception ex)
        {
          var failedItem = new MyOpportunityResponseVerifyFinalizeBatchItem
          {
            OpportunityId = item.OpportunityId,
            OpportunityTitle = opportunity?.Title ?? "Unknown",
            UserId = item.UserId,
            UserDisplayName = user?.DisplayName ?? "Unknown",
            Failure = new ErrorResponseItem
            {
              Type = ex.GetType().Name,
              Message = ex.Message
            }
          };
          resultItems.Add(failedItem);

          _logger.LogError(ex, "Failed to finalizing verification for opportunity '{OpportunityTitle}' and user '{UserDisplayName}'", failedItem.OpportunityTitle, failedItem.UserDisplayName);
        }
      }

      return new MyOpportunityResponseVerifyFinalizeBatch()
      {
        Items = [.. resultItems.OrderBy(o => o.UserDisplayName).ThenBy(o => o.OpportunityTitle)]
      };
    }

    public async Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalize request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _myOpportunityRequestValidatorVerifyFinalize.ValidateAndThrowAsync(request);

      var user = _userService.GetById(request.UserId, false, false);
      var opportunity = _opportunityService.GetById(request.OpportunityId, true, true, false);

      await FinalizeVerificationManual(user, opportunity, request.Status, false, request.Comment);
    }

    public Dictionary<Guid, int>? ListAggregatedOpportunityByViewed(bool includeExpired)
    {
      var actionId = _myOpportunityActionService.GetByName(Action.Viewed.ToString()).Id;
      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var statuses = new List<Status> { Status.Active };
      if (includeExpired) statuses.Add(Status.Expired);

      var query = _myOpportunityRepository.Query();

      query = query.Where(o => o.ActionId == actionId);
      query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusIds = statuses.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
      query = query.Where(o => statusIds.Contains(o.OpportunityStatusId));

      var queryGrouped = query.GroupBy(o => o.OpportunityId)
      .Select(group => new
      {
        OpportunityId = group.Key,
        Count = group.Count(),
        MaxDateModified = group.Max(o => o.DateModified) //max last viewed date
      });
      queryGrouped = queryGrouped.OrderByDescending(result => result.Count).ThenByDescending(result => result.MaxDateModified); //ordered by count and then by max last viewed date

      return queryGrouped.ToDictionary(o => o.OpportunityId, o => o.Count);
    }
    #endregion

    #region Private Members
    //supported statuses: Rejected or Completed
    private async Task FinalizeVerificationManual(User user, Opportunity.Models.Opportunity opportunity, VerificationStatus status, bool instantVerification, string? comment)
    {
      //can complete, provided opportunity is published (and started) or expired (actioned prior to expiration)
      var canFinalize = opportunity.Status == Status.Expired;
      if (!canFinalize) canFinalize = opportunity.Published && opportunity.DateStart <= DateTimeOffset.UtcNow;
      if (!canFinalize)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "verification cannot be finalized"));

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var item = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
          ?? throw new ValidationException($"Opportunity '{opportunity.Title}' has not been sent for verification for user '{user.Email}'");

      if (item.VerificationStatus != VerificationStatus.Pending)
        throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

      if (item.VerificationStatus == status) return;

      var statusId = _myOpportunityVerificationStatusService.GetByName(status.ToString()).Id;

      EmailType? emailType = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        item.VerificationStatusId = statusId;
        item.CommentVerification = comment;

        switch (status)
        {
          case VerificationStatus.Rejected:
            emailType = EmailType.Opportunity_Verification_Rejected;
            break;

          case VerificationStatus.Completed:
            if (item.DateEnd.HasValue && item.DateEnd.Value > DateTimeOffset.UtcNow.ToEndOfDay())
              throw new ValidationException($"Verification can not be completed as the end date for 'my' opportunity '{opportunity.Title}' has not been reached (end date '{item.DateEnd:yyyy-MM-dd}')");

            //with instant-verifications ensureOrganizationAuthorization not checked as finalized immediately by the user (youth)
            var result = await _opportunityService.AllocateRewards(opportunity.Id, user.Id, !instantVerification);
            item.ZltoReward = result.ZltoReward;
            item.YomaReward = result.YomaReward;
            item.DateCompleted = DateTimeOffset.UtcNow;

            await _userService.AssignSkills(user, opportunity);

            if (item.OpportunityCredentialIssuanceEnabled)
            {
              if (string.IsNullOrEmpty(item.OpportunitySSISchemaName))
                throw new InvalidOperationException($"Credential Issuance Enabled: Schema name expected for opportunity with id '{item.Id}'");
              await _ssiCredentialService.ScheduleIssuance(item.OpportunitySSISchemaName, item.Id);
            }

            if (result.ZltoReward.HasValue && result.ZltoReward.Value > default(decimal))
              await _rewardService.ScheduleRewardTransaction(user.Id, Reward.RewardTransactionEntityType.MyOpportunity, item.Id, result.ZltoReward.Value);

            if (result.ZltoRewardPoolDepleted == true) item.CommentVerification = CommentVerificationAppendInfo(item.CommentVerification, "ZLTO not awarded as reward pool has been depleted");
            if (result.YomaRewardPoolDepleted == true) item.CommentVerification = CommentVerificationAppendInfo(item.CommentVerification, "Yoma not awarded as reward pool has been depleted");

            emailType = EmailType.Opportunity_Verification_Completed;
            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(status), $"Status of '{status}' not supported");
        }

        item = await _myOpportunityRepository.Update(item);

        scope.Complete();
      });

      if (!emailType.HasValue)
        throw new InvalidOperationException($"Email type expected");

      await SendEmail(item, emailType.Value);
    }

    private static string CommentVerificationAppendInfo(string? currentComment, string info)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(info, nameof(info));

      return string.IsNullOrEmpty(currentComment) ? info : $"{currentComment}{System.Environment.NewLine}{info}";
    }

    private void SetParticipantCounts(MyOpportunityInfo result)
    {
      var filter = new MyOpportunitySearchFilterAdmin
      {
        TotalCountOnly = true,
        Opportunity = result.OpportunityId,
        Action = Action.Verification,
        VerificationStatuses = [VerificationStatus.Pending]
      };

      var searchResult = Search(filter, false);
      result.OpportunityParticipantCountTotal += searchResult.TotalCount ?? default;
    }

    private string? GetBlobObjectURL(StorageType? storageType, string? key)
    {
      if (!storageType.HasValue || string.IsNullOrEmpty(key)) return null;
      return _blobService.GetURL(storageType.Value, key);
    }

    private static string PerformActionNotPossibleValidationMessage(Opportunity.Models.Opportunity opportunity, string description)
    {
      var reasons = new List<string>();

      if (!opportunity.Published)
        reasons.Add("it has not been published");

      if (opportunity.Status != Status.Active)
        reasons.Add($"its status is '{opportunity.Status}'");

      if (opportunity.DateStart > DateTimeOffset.UtcNow)
        reasons.Add($"it has not yet started (start date: {opportunity.DateStart:yyyy-MM-dd})");

      var reasonText = string.Join(", ", reasons);

      return $"Opportunity '{opportunity.Title}' {description}, because {reasonText}. Please check these conditions and try again";
    }

    private async Task PerformActionSendForVerificationManual(User user, Guid opportunityId, MyOpportunityRequestVerify request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _myOpportunityRequestValidatorVerify.ValidateAndThrowAsync(request);

      if (request.DateStart.HasValue) request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.ToEndOfDay();

      //provided opportunity is published (and started) or expired
      var opportunity = _opportunityService.GetById(opportunityId, true, true, false);
      var canSendForVerification = opportunity.Status == Status.Expired;
      if (!canSendForVerification) canSendForVerification = opportunity.Published && opportunity.DateStart <= DateTimeOffset.UtcNow;
      if (!canSendForVerification)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be sent for verification"));

      if (!opportunity.VerificationEnabled)
        throw new ValidationException($"Opportunity '{opportunity.Title}' can not be completed / verification is not enabled");

      if (opportunity.VerificationMethod == null || opportunity.VerificationMethod != VerificationMethod.Manual)
        throw new ValidationException($"Opportunity '{opportunity.Title}' can not be completed / requires verification method manual");

      if (opportunity.VerificationTypes == null || opportunity.VerificationTypes.Count == 0)
        throw new DataInconsistencyException("Manual verification enabled but opportunity has no mapped verification types");

      if (request.DateStart.HasValue && request.DateStart.Value < opportunity.DateStart)
        throw new ValidationException($"Start date can not be earlier than the opportunity start date of '{opportunity.DateStart:yyyy-MM-dd}'");

      if (request.DateEnd.HasValue)
      {
        if (opportunity.DateEnd.HasValue && request.DateEnd.Value > opportunity.DateEnd.Value)
          throw new ValidationException($"End date cannot be later than the opportunity end date of '{opportunity.DateEnd.Value:yyyy-MM-dd}'");

        if (request.DateEnd.Value > DateTimeOffset.UtcNow.ToEndOfDay())
          throw new ValidationException($"End date cannot be in the future. Please select today's date or earlier");
      }

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var verificationStatusPendingId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Pending.ToString()).Id;

      var myOpportunity = _myOpportunityRepository.Query(true).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId);
      var isNew = myOpportunity == null;

      if (myOpportunity == null)
        myOpportunity = new Models.MyOpportunity
        {
          UserId = user.Id,
          OpportunityId = opportunity.Id,
          ActionId = actionVerificationId,
        };
      else
      {
        switch (myOpportunity.VerificationStatus)
        {
          case null:
            throw new DataInconsistencyException($"{nameof(myOpportunity.VerificationStatus)} expected with action '{Action.Verification}'");

          case VerificationStatus.Pending:
            if (request.OverridePending) break;
            throw new ValidationException($"Verification is {myOpportunity.VerificationStatus?.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

          case VerificationStatus.Completed:
            throw new ValidationException($"Verification is {myOpportunity.VerificationStatus?.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

          case VerificationStatus.Rejected: //can be re-send for verification
            break;

          default:
            throw new InvalidOperationException($"Unknown / unsupported '{nameof(myOpportunity.VerificationStatus)}' of '{myOpportunity.VerificationStatus.Value}'");
        }
      }

      myOpportunity.VerificationStatusId = verificationStatusPendingId;
      myOpportunity.DateStart = request.DateStart;
      myOpportunity.DateEnd = request.DateEnd;

      await PerformActionSendForVerificationManualProcessVerificationTypes(request, opportunity, myOpportunity, isNew);

      //used by emailer
      myOpportunity.UserEmail = user.Email;
      myOpportunity.UserDisplayName = user.DisplayName;
      myOpportunity.OpportunityTitle = opportunity.Title;
      myOpportunity.OrganizationId = opportunity.OrganizationId;
      myOpportunity.ZltoReward = opportunity.ZltoReward;
      myOpportunity.YomaReward = opportunity.YomaReward;

      if (request.InstantVerification) return; //with instant-verifications verification pending emails are not sent

      //sent to youth
      await SendEmail(myOpportunity, EmailType.Opportunity_Verification_Pending);

      //sent to organization admins
      //[REMOVED/TODO: Pending user settings]
      //await SendEmail(myOpportunity, EmailType.Opportunity_Verification_Pending_Admin);
    }

    private async Task SendEmail(Models.MyOpportunity myOpportunity, EmailType type)
    {
      try
      {
        List<EmailRecipient>? recipients = null;
        recipients = type switch
        {
          EmailType.Opportunity_Verification_Rejected or EmailType.Opportunity_Verification_Completed or EmailType.Opportunity_Verification_Pending => [
                          new() { Email = myOpportunity.UserEmail, DisplayName = myOpportunity.UserDisplayName }
                      ],
          EmailType.Opportunity_Verification_Pending_Admin => _organizationService.ListAdmins(myOpportunity.OrganizationId, false, false)
                          .Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.DisplayName }).ToList(),
          _ => throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported"),
        };
        if (recipients == null || recipients.Count == 0) return;

        var data = new EmailOpportunityVerification
        {
          YoIDURL = _emailURLFactory.OpportunityVerificationYoIDURL(type),
          VerificationURL = _emailURLFactory.OpportunityVerificationURL(type, myOpportunity.OrganizationId),
          Opportunities = [
            new()
            {
              Title = myOpportunity.OpportunityTitle,
              DateStart = myOpportunity.DateStart,
              DateEnd = myOpportunity.DateEnd,
              Comment = myOpportunity.CommentVerification,
              URL = _emailURLFactory.OpportunityVerificationItemURL(type, myOpportunity.OpportunityId, myOpportunity.OrganizationId),
              ZltoReward = myOpportunity.ZltoReward,
              YomaReward = myOpportunity.YomaReward
            }
            ]
        };

        await _emailProviderClient.Send(type, recipients, data);

        _logger.LogInformation("Successfully send '{emailType}' email", type);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send '{emailType}' email", type);
      }
    }

    private async Task PerformActionSendForVerificationManualProcessVerificationTypes(MyOpportunityRequestVerify request,
      Opportunity.Models.Opportunity opportunity,
      Models.MyOpportunity myOpportunity,
      bool isNew)
    {
      var itemsExisting = new List<MyOpportunityVerification>();
      var itemsExistingDeleted = new List<MyOpportunityVerification>();
      var itemsNewBlobs = new List<BlobObject>();
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

          if (isNew)
            myOpportunity = await _myOpportunityRepository.Create(myOpportunity);
          else
          {
            //delete (db) and track existing (blobs to be deleted)
            if (myOpportunity.Verifications != null)
            {
              itemsExisting.AddRange(myOpportunity.Verifications);
              foreach (var item in itemsExisting)
              {
                await _myOpportunityVerificationRepository.Delete(item);

                if (!item.FileId.HasValue) continue;
                item.File = await _blobService.Download(item.FileId.Value);
              }
            }

            myOpportunity = await _myOpportunityRepository.Update(myOpportunity);
          }

          //new items
          await PerformActionSendForVerificationManualProcessVerificationTypes(request, opportunity, myOpportunity, itemsNewBlobs);

          //delete existing items in blob storage (deleted in db above)
          foreach (var item in itemsExisting)
          {
            if (!item.FileId.HasValue) continue;
            await _blobService.Delete(item.FileId.Value);
            itemsExistingDeleted.Add(item);
          }

          scope.Complete();
        });
      }
      catch //roll back
      {
        //re-upload existing items to blob storage
        foreach (var item in itemsExistingDeleted)
        {
          if (!item.FileId.HasValue || item.File == null)
            throw new InvalidOperationException("File expected");

          await _blobService.Create(item.FileId.Value, item.File);
        }

        //delete newly create items in blob storage
        foreach (var item in itemsNewBlobs)
          await _blobService.Delete(item);

        throw;
      }
    }

    private async Task PerformActionSendForVerificationManualProcessVerificationTypes(MyOpportunityRequestVerify request,
      Opportunity.Models.Opportunity opportunity,
      Models.MyOpportunity myOpportunity,
      List<BlobObject> itemsNewBlobs)
    {
      if (request.InstantVerification) return; //with instant-verifications bypass any verification type requirements
      if (opportunity.VerificationTypes == null) return;

      foreach (var verificationType in opportunity.VerificationTypes)
      {
        var itemType = new MyOpportunityVerification
        {
          MyOpportunityId = myOpportunity.Id,
          VerificationTypeId = verificationType.Id
        };

        //upload new item to blob storage
        BlobObject? blobObject = null;
        switch (verificationType.Type)
        {
          case VerificationType.FileUpload:
            if (request.Certificate == null)
              throw new ValidationException($"Verification type '{verificationType.Type}': Certificate required");

            blobObject = await _blobService.Create(request.Certificate, FileType.Certificates);
            break;

          case VerificationType.Picture:
            if (request.Picture == null)
              throw new ValidationException($"Verification type '{verificationType.Type}': Picture required");

            blobObject = await _blobService.Create(request.Picture, FileType.Photos);
            break;

          case VerificationType.VoiceNote:
            if (request.VoiceNote == null)
              throw new ValidationException($"Verification type '{verificationType.Type}': Voice note required");

            blobObject = await _blobService.Create(request.VoiceNote, FileType.VoiceNotes);
            break;

          case VerificationType.Location:
            if (request.Geometry == null)
              throw new ValidationException($"Verification type '{verificationType.Type}': Geometry required");

            if (request.Geometry.Type != SpatialType.Point)
              throw new ValidationException($"Verification type '{verificationType.Type}': Spatial type '{SpatialType.Point}' required");

            itemType.GeometryProperties = JsonConvert.SerializeObject(request.Geometry);
            break;

          default:
            throw new InvalidOperationException($"Unknown / unsupported '{nameof(VerificationType)}' of '{verificationType.Type}'");
        }

        //create new item in db
        if (blobObject != null)
        {
          itemType.FileId = blobObject.Id;
          itemsNewBlobs.Add(blobObject);
        }

        await _myOpportunityVerificationRepository.Create(itemType);
      }
    }
    #endregion
  }
}
