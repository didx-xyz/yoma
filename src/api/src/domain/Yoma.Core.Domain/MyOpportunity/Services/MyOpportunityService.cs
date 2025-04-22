using CsvHelper.Configuration;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using StackExchange.Redis;
using System.Transactions;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
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
using CsvHelper.Configuration.Attributes;
using System.Globalization;
using System.Reflection;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Helpers;
using Yoma.Core.Domain.Lookups.Models;

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
    private readonly INotificationURLFactory _notificationURLFactory;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly ICountryService _countryService;
    private readonly IGenderService _genderService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IDownloadService _downloadService;
    private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
    private readonly MyOpportunitySearchFilterVerificationFilesAdminValidator _myOpportunitySearchFilterVerificationFilesAdminValidator;
    private readonly MyOpportunitySearchFilterAdminValidator _myOpportunitySearchFilterAdminValidator;
    private readonly MyOpportunityRequestValidatorVerify _myOpportunityRequestValidatorVerify;
    private readonly MyOpportunityRequestValidatorVerifyFinalize _myOpportunityRequestValidatorVerifyFinalize;
    private readonly MyOpportunityRequestValidatorVerifyFinalizeBatch _myOpportunityRequestValidatorVerifyFinalizeBatch;
    private readonly MyOpportunityRequestValidatorVerifyImportCsv _myOpportunityRequestValidatorVerifyImportCsv;
    private readonly IRepositoryBatchedWithNavigation<Models.MyOpportunity> _myOpportunityRepository;
    private readonly IRepository<MyOpportunityVerification> _myOpportunityVerificationRepository;
    private readonly IExecutionStrategyService _executionStrategyService;

    private const int List_Aggregated_Opportunity_By_Limit = 100;
    private const string PlaceholderValue_HiddenDetails = "hidden";

    public static readonly VerificationType[] VerificationTypes_Downloadable = [VerificationType.FileUpload, VerificationType.Picture, VerificationType.VoiceNote, VerificationType.Video];
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
        INotificationURLFactory notificationURLFactory,
        INotificationDeliveryService notificationDeliveryService,
        ICountryService countryService,
        IGenderService genderService,
        ITimeIntervalService timeIntervalService,
        IDownloadService downloadService,
        IOpportunityVerificationTypeService opportunityVerificationTypeService,
        MyOpportunitySearchFilterVerificationFilesAdminValidator myOpportunitySearchFilterVerificationFilesAdminValidator,
        MyOpportunitySearchFilterAdminValidator myOpportunitySearchFilterAdminValidator,
        MyOpportunityRequestValidatorVerify myOpportunityRequestValidatorVerify,
        MyOpportunityRequestValidatorVerifyFinalize myOpportunityRequestValidatorVerifyFinalize,
        MyOpportunityRequestValidatorVerifyFinalizeBatch myOpportunityRequestValidatorVerifyFinalizeBatch,
        MyOpportunityRequestValidatorVerifyImportCsv myOpportunityRequestValidatorVerifyImportCsv,
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
      _notificationURLFactory = notificationURLFactory;
      _notificationDeliveryService = notificationDeliveryService;
      _countryService = countryService;
      _genderService = genderService;
      _timeIntervalService = timeIntervalService;
      _downloadService = downloadService;
      _opportunityVerificationTypeService = opportunityVerificationTypeService;
      _myOpportunitySearchFilterVerificationFilesAdminValidator = myOpportunitySearchFilterVerificationFilesAdminValidator;
      _myOpportunitySearchFilterAdminValidator = myOpportunitySearchFilterAdminValidator;
      _myOpportunityRequestValidatorVerify = myOpportunityRequestValidatorVerify;
      _myOpportunityRequestValidatorVerifyFinalize = myOpportunityRequestValidatorVerifyFinalize;
      _myOpportunityRequestValidatorVerifyFinalizeBatch = myOpportunityRequestValidatorVerifyFinalizeBatch;
      _myOpportunityRequestValidatorVerifyImportCsv = myOpportunityRequestValidatorVerifyImportCsv;
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
          organizations = [.. organizations.Distinct()];
          _organizationService.IsAdminsOf(organizations, true);
        }
        else
          //ensure search only spans authorized organizations
          organizations = [.. _organizationService.ListAdminsOf(false).Select(o => o.Id)];
      }

      if (organizations != null && organizations.Count != 0)
        query = query.Where(o => organizations.Contains(o.OrganizationId));

      if (verificationStatuses == null || verificationStatuses.Count == 0) //default to all if not explicitly specified
        verificationStatuses = [VerificationStatus.Pending, VerificationStatus.Completed, VerificationStatus.Rejected]; //all
      verificationStatuses = [.. verificationStatuses.Distinct()];

      var opportunityStatusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var opportunityStatusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;

      var predicate = PredicateBuilder.False<Models.MyOpportunity>();

      foreach (var status in verificationStatuses)
      {
        var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(status.ToString()).Id;

        predicate = status switch
        {
          // items that can be completed, thus started opportunities (active) or expired opportunities that relate to active organizations
          VerificationStatus.Pending =>
              predicate.Or(o => o.VerificationStatusId == verificationStatusId && ((o.OpportunityStatusId == opportunityStatusActiveId && o.DateStart <= DateTimeOffset.UtcNow) ||
              o.OpportunityStatusId == opportunityStatusExpiredId) && o.OrganizationStatusId == organizationStatusActiveId),

          // all, irrespective of related opportunity and organization status
          VerificationStatus.Completed => predicate.Or(o => o.VerificationStatusId == verificationStatusId),

          // all, irrespective of related opportunity and organization status
          VerificationStatus.Rejected => predicate.Or(o => o.VerificationStatusId == verificationStatusId),

          _ => throw new InvalidOperationException($"Unknown / unsupported '{nameof(status)}' of '{status}'"),
        };
      }

      query = query.Where(predicate);

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

    public async Task DownloadVerificationFilesSchedule(MyOpportunitySearchFilterVerificationFiles filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var myFilter = new MyOpportunitySearchFilterVerificationFilesAdmin
      {
        Opportunity = filter.Opportunity,
        VerificationTypes = filter.VerificationTypes,
        CompletedVerificationsOnly = true,
        TotalCountOnly = true
      };

      var result = await DownloadVerificationFiles(myFilter, ensureOrganizationAuthorization);

      if (!result.TotalCount.HasValue)
        throw new InvalidOperationException("Total count expected");

      if (result.TotalCount <= _appSettings.DownloadScheduleVerificationFilesBatchSize)
      {
        await _downloadService.Schedule(user.Id, DownloadScheduleType.MyOpportunityVerificationFiles, myFilter);
        return;
      }

      myFilter.PageSize = _appSettings.DownloadScheduleVerificationFilesBatchSize;
      var totalPages = (int)Math.Ceiling((double)result.TotalCount.Value / myFilter.PageSize.Value);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        for (var page = 1; page <= totalPages; page++)
        {
          myFilter.PageNumber = page;
          await _downloadService.Schedule(user.Id, DownloadScheduleType.MyOpportunityVerificationFiles, myFilter);
        }

        scope.Complete();
      });
    }

    public async Task<IFormFile> DownloadVerificationFiles(MyOpportunitySearchFilterVerificationFiles filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      //filter validated as admin filter
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var myFilter = new MyOpportunitySearchFilterVerificationFilesAdmin
      {
        Opportunity = filter.Opportunity,
        VerificationTypes = filter.VerificationTypes,
        UserId = user.Id
      };

      var files = await DownloadVerificationFiles(myFilter, false);

      if (files.Files == null || files.Files.Count == 0)
        throw new InvalidOperationException("One or more files expected for download of 'my' opportunity verification files");

      try
      {
        return FileHelper.Zip(files.Files, $"Files.zip");
      }
      finally
      {
        TempFileTracker.Delete(files.Files);
      }
    }

    public async Task<MyOpportunitySearchResultsVerificationFilesAdmin> DownloadVerificationFiles(MyOpportunitySearchFilterVerificationFilesAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      await _myOpportunitySearchFilterVerificationFilesAdminValidator.ValidateAndThrowAsync(filter);

      var opportunity = _opportunityService.GetById(filter.Opportunity, false, false, false);

      if (ensureOrganizationAuthorization)
        _organizationService.IsAdmin(opportunity.OrganizationId, true);

      //default to all downloadable types if not explicitly specified; only validated when explicitly specified
      var validateVerificationTypes = true;
      var verificationTypes = filter.VerificationTypes?.Distinct().ToList();
      if (verificationTypes == null || verificationTypes.Count == 0)
      {
        verificationTypes = [.. VerificationTypes_Downloadable];
        validateVerificationTypes = false;
      }

      //only throw entity not found exception if UserId was explicitly specified
      var throwEntityNotFoundException = filter.UserId.HasValue;

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;

      var query = _myOpportunityRepository.Query(false);

      //opportunityId
      query = query.Where(o => o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId);

      //userId
      if (filter.UserId.HasValue)
        query = query.Where(o => o.UserId == filter.UserId.Value);

      //completedVerificationsOnly
      if (filter.CompletedVerificationsOnly)
      {
        var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Completed.ToString()).Id;
        query = query.Where(o => o.VerificationStatusId == verificationStatusId);
      }

      //verfication sub query
      //verificationTypes
      var verificationTypeIds = verificationTypes.Select(t => _opportunityVerificationTypeService.GetByType(t).Id).ToList();

      var myOpporunityIds = query.Select(o => o.Id).Distinct().ToList();

      if (throwEntityNotFoundException && myOpporunityIds.Count == 0)
        throw new EntityNotFoundException($"Verification not actioned for opportunity with id '{filter.Opportunity}'");

      var verificationQuery = _myOpportunityVerificationRepository.Query()
        .Where(o => myOpporunityIds.Contains(o.MyOpportunityId) && verificationTypeIds.Contains(o.VerificationTypeId));

      var results = new MyOpportunitySearchResultsVerificationFilesAdmin
      {
        OpportunityTitle = opportunity.Title.RemoveSpecialCharacters().TrimToLength(100)
      };

      //totalCountOnly
      if (filter.TotalCountOnly)
      {
        results.TotalCount = verificationQuery.Count();
        return results;
      }

      verificationQuery = verificationQuery.OrderBy(o => o.Id);  //ensure deterministic sorting / consistent pagination results

      //paginationEnabled
      if (filter.PaginationEnabled)
      {
        results.TotalCount = verificationQuery.Count();
        verificationQuery = verificationQuery.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      var items = verificationQuery.ToList();

      if (throwEntityNotFoundException)
      {
        if (items.Count == 0)
          throw new EntityNotFoundException($"No downloadable verification files found for opportunity with id '{filter.Opportunity}'");

        if (validateVerificationTypes)
        {
          var notFound = verificationTypes.Except(items.Select(i => i.VerificationType).Distinct()).ToList();
          if (notFound.Count > 0) throw new EntityNotFoundException($"Requested verification type(s) '{string.Join(", ", notFound)}' not found for opportunity with id '{filter.Opportunity}'");
        }
      }

      var downloadTasks = new List<Task<IFormFile?>>();
      foreach (var item in items)
      {
        if (!item.FileId.HasValue) throw new InvalidOperationException("File id expected");

        //add task to download in parallel
        downloadTasks.Add(DownloadToFile(item.FileId.Value, item.UserDisplayName, filter.UserId.HasValue));
      }

      //execute all downloads in parallel
      var downloadedFiles = await Task.WhenAll(downloadTasks).FlattenAggregateException();

      //add downloaded files to the result; empty files returned as null — ignored (legacy data)
      results.Files = downloadedFiles?.OfType<IFormFile>().ToList();

      return results;
    }

    public MyOpportunityResponseVerifyStatus GetVerificationStatus(Guid opportunityId)
    {
      var opportunity = _opportunityService.GetById(opportunityId, false, false, false);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId);
      if (myOpportunity == null) return new MyOpportunityResponseVerifyStatus { Status = VerificationStatus.None };

      if (!myOpportunity.VerificationStatus.HasValue)
        throw new InvalidOperationException($"Verification status expected for 'my' opportunity with id '{myOpportunity.Id}'");

      return new MyOpportunityResponseVerifyStatus { Status = myOpportunity.VerificationStatus.Value, Comment = myOpportunity.CommentVerification };
    }

    public MyOpportunityResponseVerifyCompletedExternal GetVerificationCompletedExternal(Guid opportunityId)
    {
      var opportunity = _opportunityService.GetById(opportunityId, false, false, false);

      if (opportunity.ShareWithPartners != true)
        throw new EntityNotFoundException($"Opportunity with id '{opportunityId}' is not shared with partners");

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var verificationStatusCompleted = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Completed.ToString()).Id;

      var completions = _myOpportunityRepository.Query(false).Where(
        o => o.ActionId == actionVerificationId
        && o.VerificationStatusId == verificationStatusCompleted
        && o.OpportunityId == opportunity.Id).ToList();

      var users = completions.Where(completion =>
         SettingsHelper.GetValue<bool>(
             _userService.GetSettingsInfo(completion.UserSettings),
             Setting.User_Share_Contact_Info_With_Partners.ToString()) == true
         ).Select(completion => new MyOpportunityResponseVerifyStatusExternalUser
         {
           Username = completion.Username,
           Email = completion.UserEmail,
           PhoneNumber = completion.UserPhoneNumber,
           DateCompleted = completion.DateCompleted
         }).ToList();

      return new MyOpportunityResponseVerifyCompletedExternal { Users = users.Count != 0 ? users : null };
    }

    public MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter, User? user)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      //filter validated by SearchAdmin

      user ??= _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var filterInternal = new MyOpportunitySearchFilterAdmin
      {
        UserId = user.Id,
        Action = filter.Action,
        VerificationStatuses = filter.VerificationStatuses,
        TotalCountOnly = filter.TotalCountOnly,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize,
        SortOrder = filter.SortOrder,
        UnrestrictedQuery = filter.UnrestrictedQuery
      };

      return Search(filterInternal, false);
    }

    public TimeIntervalSummary GetSummary()
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var filterInternal = new MyOpportunitySearchFilterAdmin
      {
        UserId = user.Id,
        Action = Action.Verification,
        VerificationStatuses = [VerificationStatus.Pending, VerificationStatus.Completed, VerificationStatus.Rejected],
        UnrestrictedQuery = true
      };

      var searchResultVerification = Search(filterInternal, false);

      var itemsCompleted = SummaryGroupByWeekItems([.. searchResultVerification.Items.Where(o => o.Action == Action.Verification && o.VerificationStatus == VerificationStatus.Completed)]);
      var resultsCompleted = new List<TimeValueEntry>();
      itemsCompleted.ForEach(o => { resultsCompleted.Add(new TimeValueEntry(o.WeekEnding, o.Count, default(int), default(int), default(int))); });

      var itemsPending = SummaryGroupByWeekItems([.. searchResultVerification.Items.Where(o => o.Action == Action.Verification && o.VerificationStatus == VerificationStatus.Pending)]);
      var resultsPending = new List<TimeValueEntry>();
      itemsPending.ForEach(o => { resultsPending.Add(new TimeValueEntry(o.WeekEnding, default(int), o.Count, default(int), default(int))); });

      var itemsRejected = SummaryGroupByWeekItems([.. searchResultVerification.Items.Where(o => o.Action == Action.Verification && o.VerificationStatus == VerificationStatus.Rejected)]);
      var resultsRejected = new List<TimeValueEntry>();
      itemsRejected.ForEach(o => { resultsRejected.Add(new TimeValueEntry(o.WeekEnding, default(int), default(int), o.Count, default(int))); });

      filterInternal.Action = Action.Saved;
      filterInternal.VerificationStatuses = null;
      var searchResultSaved = Search(filterInternal, false);

      var itemSaved = SummaryGroupByWeekItems(searchResultSaved.Items);
      var resultsSaved = new List<TimeValueEntry>();
      itemSaved.ForEach(o => { resultsSaved.Add(new TimeValueEntry(o.WeekEnding, default(int), default(int), default(int), o.Count)); });

      var resultsCombined = resultsCompleted.Concat(resultsPending).Concat(resultsRejected).Concat(resultsSaved)
        .GroupBy(e => e.Date)
        .Select(g => new TimeValueEntry(
            g.Key,
            g.Sum(e => Convert.ToInt32(e.Values[0])), //completed
            g.Sum(e => Convert.ToInt32(e.Values[1])), //pending
            g.Sum(e => Convert.ToInt32(e.Values[2])), //rejected
            g.Sum(e => Convert.ToInt32(e.Values[3]))  //saved
        ))
        .OrderByDescending(e => e.Date)
        .Take(Constants.TimeIntervalSummary_Data_MaxNoOfPoints)
        .Reverse()
        .ToList();

      var result = new TimeIntervalSummary
      {
        Legend = ["Completed", "Pending", "Rejected", "Saved"],
        Data = resultsCombined,
        Count = [itemsCompleted.Sum(o => o.Count), itemsPending.Sum(o => o.Count), itemsRejected.Sum(o => o.Count), itemSaved.Sum(o => o.Count)]
      };

      return result;
    }

    public MyOpportunitySearchResults Search(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _myOpportunitySearchFilterAdminValidator.ValidateAndThrow(filter);

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
          filter.Organizations = [.. filter.Organizations.Distinct()];
          _organizationService.IsAdminsOf(filter.Organizations, true);
        }
        else
          //ensure search only spans authorized organizations
          filter.Organizations = [.. _organizationService.ListAdminsOf(false).Select(o => o.Id)];
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

        var matchedOpportunityIds = _opportunityService.Contains(filter.ValueContains, false, false).Select(o => o.Id).ToList();
        predicate = predicate.Or(o => matchedOpportunityIds.Contains(o.OpportunityId));

        var matchedUserIds = _userService.Contains(filter.ValueContains, false, false).Select(o => o.Id).ToList();
        predicate = predicate.Or(o => matchedUserIds.Contains(o.UserId));

        query = query.Where(predicate);
      }

      var orderInstructions = new List<FilterOrdering<Models.MyOpportunity>>();
      switch (filter.Action)
      {
        case Action.Saved:
        case Action.Viewed:
        case Action.NavigatedExternalLink:
          orderInstructions.Add(new() { OrderBy = o => o.DateModified, SortOrder = filter.SortOrder });

          if (filter.NonActionVerificationPublishedOnly) //default behaviour
          {
            //published: relating to active opportunities (irrespective of started) that relates to active organizations
            query = query.Where(o => o.OpportunityStatusId == opportunityStatusActiveId);
            query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);
          }

          break;

        case Action.Verification:
          if (filter.VerificationStatuses == null || filter.VerificationStatuses.Count == 0)
            throw new ArgumentNullException(nameof(filter), "One or more verification status(es) required");
          filter.VerificationStatuses = [.. filter.VerificationStatuses.Distinct()];

          orderInstructions.Add(new() { OrderBy = o => o.DateModified, SortOrder = filter.SortOrder });

          var predicate = PredicateBuilder.False<Models.MyOpportunity>();

          foreach (var status in filter.VerificationStatuses)
          {
            var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(status.ToString()).Id;

            switch (status)
            {
              case VerificationStatus.Pending:
                //items that can be completed, thus started opportunities (active) or expired opportunities that relates to active organizations
                predicate = predicate.Or(o => o.VerificationStatusId == verificationStatusId && ((o.OpportunityStatusId == opportunityStatusActiveId && o.DateStart <= DateTimeOffset.UtcNow) ||
                    o.OpportunityStatusId == opportunityStatusExpiredId) && o.OrganizationStatusId == organizationStatusActiveId);
                break;

              case VerificationStatus.Completed:
                //all, irrespective of related opportunity and organization status
                predicate = predicate.Or(o => o.VerificationStatusId == verificationStatusId);

                orderInstructions.Add(new() { OrderBy = o => o.DateCompleted ?? DateTime.MaxValue, SortOrder = filter.SortOrder });

                break;
              case VerificationStatus.Rejected:
                //all, irrespective of related opportunity and organization status
                predicate = predicate.Or(o => o.VerificationStatusId == verificationStatusId);
                break;

              default:
                throw new InvalidOperationException($"Unknown / unsupported '{nameof(filter.VerificationStatuses)}' of '{status}'");
            }
          }

          query = query.Where(predicate);
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

      if (!filter.UnrestrictedQuery || filter.PaginationEnabled)
      {
        orderInstructions.Add(new() { OrderBy = o => o.Id, SortOrder = FilterSortOrder.Ascending }); //ensure deterministic sorting / consistent pagination results 
        query = query.ApplyFiltersAndOrdering(orderInstructions);
      }

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      var items = query.ToList();

      if (!filter.UnrestrictedQuery)
      {
        items.ForEach(o =>
        {
          o.UserPhotoURL = GetBlobObjectURL(o.UserPhotoStorageType, o.UserPhotoKey);
          o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoStorageType, o.OrganizationLogoKey);
          o.Verifications?.ForEach(v => v.FileURL = GetBlobObjectURL(v.FileStorageType, v.FileKey));
        });
      }
      result.Items = [.. items.Select(o => o.ToInfo())];
      if (filter.UnrestrictedQuery) return result;

      result.Items.ForEach(o => SetEngagementCounts(o));
      return result;
    }

    public async Task<(bool scheduleForProcessing, string? fileName, byte[]? bytes)> ExportOrScheduleToCSV(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      if (!filter.PaginationEnabled)
      {
        //schedule the request for processing and return
        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        await _downloadService.Schedule(user.Id, DownloadScheduleType.MyOpportunityVerifications, filter);
        return (true, null, null);
      }

      var (fileName, bytes) = ExportToCSV(filter, ensureOrganizationAuthorization, true);

      return (false, fileName, bytes);
    }

    public (string fileName, byte[] bytes) ExportToCSV(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization, bool appendDateStamp)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var result = Search(filter, ensureOrganizationAuthorization);

      foreach (var item in result.Items)
      {
        if (SettingsHelper.GetValue<bool>(_userService.GetSettingsInfo(item.UserSettings), Setting.User_Share_Contact_Info_With_Partners.ToString()) == true) continue;
        item.UserEmail = PlaceholderValue_HiddenDetails;
        item.UserPhoneNumer = PlaceholderValue_HiddenDetails;
      }

      return FileHelper.CreateCsvFile(result.Items, "Verifications", appendDateStamp);
    }

    public async Task PerformActionViewed(Guid opportunityId)
    {
      //published opportunities (irrespective of started)
      var opportunity = _opportunityService.GetById(opportunityId, false, true, false);
      if (!opportunity.Published)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be actioned"));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

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

    public async Task PerformActionNavigatedExternalLink(Guid opportunityId)
    {
      //published opportunities (irrespective of started)
      var opportunity = _opportunityService.GetById(opportunityId, false, true, false);
      if (!opportunity.Published)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be actioned"));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionViewedId = _myOpportunityActionService.GetByName(Action.NavigatedExternalLink.ToString()).Id;

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

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

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

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

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

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;
      var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);

      if (myOpportunity == null) return; //not saved

      await _myOpportunityRepository.Delete(myOpportunity);
    }

    public async Task PerformActionSendForVerificationManual(Guid userId, Guid opportunityId, MyOpportunityRequestVerify request, bool overridePending)
    {
      var user = _userService.GetById(userId, false, false);

      request.OverridePending = overridePending;

      await PerformActionSendForVerification(user, opportunityId, request, VerificationMethod.Manual);
    }

    public async Task PerformActionSendForVerificationManual(Guid opportunityId, MyOpportunityRequestVerify request)
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      await PerformActionSendForVerification(user, opportunityId, request, VerificationMethod.Manual);
    }

    public async Task PerformActionInstantVerification(Guid linkId)
    {
      var link = _linkService.GetById(linkId, false, false);

      link.AssertLinkInstantVerify();

      //ensure link is still usable
      _linkService.AssertActive(link.Id);

      //send for verification
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var opportunity = _opportunityService.GetById(link.EntityId, true, true, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        await _linkService.LogUsage(link.Id);

        var request = new MyOpportunityRequestVerify { InstantOrImportedVerification = true, OverridePending = true };
        await PerformActionSendForVerification(user, link.EntityId, request, null); //any verification method

        await FinalizeVerification(user, opportunity, VerificationStatus.Completed, true, "Auto-verification");

        scope.Complete();
      });
    }

    public async Task PerformActionSendForVerificationManualDelete(Guid opportunityId)
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      //opportunity can be updated whilst active, and can result in disabling support for verification; allow deletion provided verification is pending even if no longer supported
      //similar logic provided sent for verification prior to update that resulted in disabling support for verification i.e. enabled, method, types, 'published' status etc.
      var opportunity = _opportunityService.GetById(opportunityId, true, true, false);

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var myOpportunity = _myOpportunityRepository.Query(true).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
          ?? throw new ValidationException($"Opportunity '{opportunity.Title}' has not been sent for verification for user '{user.Username}'");

      if (myOpportunity.VerificationStatus != VerificationStatus.Pending)
        throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for opportunity '{opportunity.Title}'");

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

      request.Items = [.. request.Items.GroupBy(i => new { i.OpportunityId, i.UserId }).Select(g => g.First())];

      User? user = null;
      Opportunity.Models.Opportunity? opportunity = null;
      var resultItems = new List<MyOpportunityResponseVerifyFinalizeBatchItem>();
      foreach (var item in request.Items)
      {
        try
        {
          user = _userService.GetById(item.UserId, false, false);
          opportunity = _opportunityService.GetById(item.OpportunityId, true, true, false);

          await FinalizeVerification(user, opportunity, request.Status, false, request.Comment);

          var successItem = new MyOpportunityResponseVerifyFinalizeBatchItem
          {
            OpportunityId = item.OpportunityId,
            OpportunityTitle = opportunity.Title,
            UserId = item.UserId,
            UserDisplayName = user.DisplayName ?? user.Username,
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

          _logger.LogError(ex, "Failed to finalizing verification for opportunity '{OpportunityTitle}' and user '{UserDisplayName}': {errorMessage}", failedItem.OpportunityTitle, failedItem.UserDisplayName, ex.Message);
        }
      }

      return new MyOpportunityResponseVerifyFinalizeBatch()
      {
        Status = request.Status,
        Items = [.. resultItems.OrderBy(o => o.UserDisplayName).ThenBy(o => o.OpportunityTitle)]
      };
    }

    public async Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalize request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _myOpportunityRequestValidatorVerifyFinalize.ValidateAndThrowAsync(request);

      var user = _userService.GetById(request.UserId, false, false);
      var opportunity = _opportunityService.GetById(request.OpportunityId, true, true, false);

      await FinalizeVerification(user, opportunity, request.Status, false, request.Comment);
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
        Title = group.First().OpportunityTitle,
        Count = group.Count(),
        MaxDateModified = group.Max(o => o.DateModified) //max date viewed
      });
      queryGrouped = queryGrouped.OrderByDescending(result => result.Count).ThenByDescending(result => result.MaxDateModified).ThenBy(o => o.Title). //ordered by count, then by max date modified and then by title
        ThenBy(o => o.OpportunityId); //ensure deterministic sorting / consistent pagination results
      queryGrouped = queryGrouped.Take(List_Aggregated_Opportunity_By_Limit); //limit

      return queryGrouped.ToDictionary(o => o.OpportunityId, o => o.Count);
    }

    public Dictionary<Guid, int>? ListAggregatedOpportunityByCompleted(bool includeExpired)
    {
      var actionId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Completed.ToString()).Id;
      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var statuses = new List<Status> { Status.Active };
      if (includeExpired) statuses.Add(Status.Expired);

      var query = _myOpportunityRepository.Query();

      query = query.Where(o => o.ActionId == actionId);
      query = query.Where(o => o.VerificationStatusId == verificationStatusId);
      query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusIds = statuses.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
      query = query.Where(o => statusIds.Contains(o.OpportunityStatusId));

      var queryGrouped = query.GroupBy(o => o.OpportunityId)
      .Select(group => new
      {
        OpportunityId = group.Key,
        Title = group.First().OpportunityTitle,
        Count = group.Count(),
        MaxDateCompleted = group.Max(o => o.DateCompleted) //max date completed
      });
      queryGrouped = queryGrouped.OrderByDescending(result => result.Count).ThenByDescending(result => result.MaxDateCompleted).ThenBy(o => o.Title). //ordered by count, then by max date completed and then by title
        ThenBy(o => o.OpportunityId); //ensure deterministic sorting / consistent pagination results
      queryGrouped = queryGrouped.Take(List_Aggregated_Opportunity_By_Limit);

      return queryGrouped.ToDictionary(o => o.OpportunityId, o => o.Count);
    }

    public async Task PerformActionImportVerificationFromCSV(MyOpportunityRequestVerifyImportCsv request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _myOpportunityRequestValidatorVerifyImportCsv.ValidateAndThrowAsync(request);

      var organization = _organizationService.GetById(request.OrganizationId, false, false, ensureOrganizationAuthorization);

      request.Comment = request.Comment?.Trim();
      if (string.IsNullOrEmpty(request.Comment)) request.Comment = "Auto-verification";

      using var stream = request.File.OpenReadStream();
      using var reader = new StreamReader(stream);

      var config = new CsvConfiguration(CultureInfo.InvariantCulture)
      {
        Delimiter = ",",
        HasHeaderRecord = true,
        MissingFieldFound = args =>
        {
          if (args.Context?.Reader?.HeaderRecord == null)
            throw new ValidationException("The file is missing a header row");

          var fieldName = args.HeaderNames?[args.Index] ?? $"Field at index {args.Index}";

          var modelType = typeof(MyOpportunityInfoCsvImport);

          var property = modelType.GetProperties(BindingFlags.Public | BindingFlags.Instance)
              .FirstOrDefault(p =>
                  string.Equals(
                      p.GetCustomAttributes(typeof(NameAttribute), true)
                          .Cast<NameAttribute>()
                          .FirstOrDefault()?.Names.FirstOrDefault() ?? p.Name,
                      fieldName,
                      StringComparison.OrdinalIgnoreCase));

          if (property == null) return;

          var isRequired = property.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.RequiredAttribute), true).Length > 0;

          if (isRequired)
          {
            var rowNumber = args.Context?.Parser?.Row.ToString() ?? "Unknown";
            throw new ValidationException($"Missing required field '{fieldName}' in row '{rowNumber}'");
          }
        },
        BadDataFound = args =>
        {
          var rowNumber = args.Context?.Parser?.Row.ToString() ?? "Unknown";
          throw new ValidationException($"Bad data format in row '{rowNumber}': Raw field data: '{args.Field}'");
        }
      };

      using var csv = new CsvHelper.CsvReader(reader, config);

      if (!csv.Read() || csv.Context?.Reader?.HeaderRecord?.Length == 0)
        throw new ValidationException("The file is missing a header row");

      csv.ReadHeader();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        while (await csv.ReadAsync())
        {
          var rowNumber = csv.Context?.Parser?.Row ?? -1;
          try
          {
            var record = csv.GetRecord<MyOpportunityInfoCsvImport>();

            await ProcessImportVerification(request, record);
          }
          catch (Exception ex)
          {
            throw new ValidationException($"Error processing row '{(rowNumber == -1 ? "Unknown" : rowNumber)}': {ex.Message}");
          }
        }
        scope.Complete();
      });
    }
    #endregion

    #region Private Members
    private async Task<IFormFile?> DownloadToFile(Guid fileId, string userDisplayName, bool userExplictlySpecified)
    {
      var (originalFileName, contentType, tempSourceFile) = await _blobService.DownloadRawToFile(fileId);

      var fileInfo = new FileInfo(tempSourceFile);
      if (!fileInfo.Exists || fileInfo.Length == 0) // skip empty or missing files (legacy data)
        return null;

      if (!userExplictlySpecified)
      {
        if (string.IsNullOrWhiteSpace(userDisplayName)) userDisplayName = "Unknown";
        userDisplayName = userDisplayName.Trim();

        var displayNameCleaned = userDisplayName.RemoveSpecialCharacters();
        displayNameCleaned = displayNameCleaned.Replace(' ', '_');
        originalFileName = $"{displayNameCleaned}{FileHelper.Zip_FileName_Path_Separator}{originalFileName}";
      }

      return FileHelper.FromFilePath(originalFileName, contentType, tempSourceFile);
    }

    private async Task ProcessImportVerification(MyOpportunityRequestVerifyImportCsv requestImport, MyOpportunityInfoCsvImport item)
    {
      item.Email = string.IsNullOrWhiteSpace(item.Email) ? null : item.Email.Trim();
      item.PhoneNumber = string.IsNullOrWhiteSpace(item.PhoneNumber) ? null : item.PhoneNumber.Trim();
      item.FirstName = string.IsNullOrWhiteSpace(item.FirstName) ? null : item.FirstName.Trim();
      item.Surname = string.IsNullOrWhiteSpace(item.Surname) ? null : item.Surname.Trim();

      Domain.Lookups.Models.Country? country = null;
      if (!string.IsNullOrEmpty(item.Country)) country = _countryService.GetByCodeAplha2(item.Country);

      Domain.Lookups.Models.Gender? gender = null;
      if (!string.IsNullOrEmpty(item.Gender)) gender = _genderService.GetByName(item.Gender);

      var username = item.Email ?? item.PhoneNumber;
      if (string.IsNullOrEmpty(username))
        throw new ValidationException("Email or phone number required");

      if (string.IsNullOrWhiteSpace(item.OpporunityExternalId))
        throw new ValidationException("Opportunity external id required");

      var opportunity = _opportunityService.GetByExternalId(requestImport.OrganizationId, item.OpporunityExternalId, true, true);
      if (opportunity.VerificationMethod != VerificationMethod.Automatic)
        throw new ValidationException($"Verification import not supported for opporunity '{opportunity.Title}'. The verification method must be set to 'Automatic'");

      var user = _userService.GetByUsernameOrNull(username, false, false);
      //user is created if not existing, or updated if not linked to an identity provider
      if (user == null || !user.ExternalId.HasValue)
      {
        var request = new UserRequest
        {
          Id = user?.Id,
          Username = username,
          Email = item.Email,
          PhoneNumber = item.PhoneNumber,
          FirstName = item.FirstName,
          Surname = item.Surname,
          EmailConfirmed = item.Email == null ? null : false,
          PhoneNumberConfirmed = item.PhoneNumber == null ? null : false,
          CountryId = country?.Id,
          GenderId = gender?.Id
        };

        user = await _userService.Upsert(request);
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        var requestVerify = new MyOpportunityRequestVerify { InstantOrImportedVerification = true };
        await PerformActionSendForVerification(user, opportunity.Id, requestVerify, null); //any verification method

        await FinalizeVerification(user, opportunity, VerificationStatus.Completed, true, requestImport.Comment);

        scope.Complete();
      });
    }

    private static List<(DateTime WeekEnding, int Count)> SummaryGroupByWeekItems(List<MyOpportunityInfo> items)
    {
      var results = items
        .Select(o => new
        {
          Date = (o.Action == Action.Verification && o.VerificationStatus == VerificationStatus.Completed && o.DateCompleted.HasValue)
                          ? o.DateCompleted.Value
                          : o.DateModified
        })
        .GroupBy(x => x.Date.AddDays(-(int)x.Date.DayOfWeek).AddDays(7).Date)
        .Select(group => (WeekEnding: group.Key, Count: group.Count()))
        .OrderBy(result => result.WeekEnding)
        .ToList();

      return results;
    }

    //supported statuses: Rejected or Completed
    private async Task FinalizeVerification(User user, Opportunity.Models.Opportunity opportunity, VerificationStatus status, bool instantVerification, string? comment)
    {
      //can complete, provided opportunity is published (and started) or expired (actioned prior to expiration)
      var canFinalize = opportunity.Status == Status.Expired;
      if (!canFinalize) canFinalize = opportunity.Published && opportunity.DateStart <= DateTimeOffset.UtcNow;
      if (!canFinalize)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "verification cannot be finalized"));

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var item = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
          ?? throw new ValidationException($"Opportunity '{opportunity.Title}' has not been sent for verification for user '{user.Username}'");

      if (item.VerificationStatus != VerificationStatus.Pending)
        throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for opportunity '{opportunity.Title}'");

      if (item.VerificationStatus == status) return;

      var statusId = _myOpportunityVerificationStatusService.GetByName(status.ToString()).Id;

      NotificationType? notificationType = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        item.VerificationStatusId = statusId;
        item.CommentVerification = comment;

        switch (status)
        {
          case VerificationStatus.Rejected:
            notificationType = NotificationType.Opportunity_Verification_Rejected;
            break;

          case VerificationStatus.Completed:
            if (item.DateEnd.HasValue && item.DateEnd.Value > DateTimeOffset.UtcNow.ToEndOfDay())
              throw new ValidationException($"Verification can not be completed as the end date for opportunity '{opportunity.Title}' has not been reached (end date '{item.DateEnd:yyyy-MM-dd}')");

            EnsureNoEarlierPendingVerificationsForOtherStudents(user, opportunity, item, instantVerification);

            //with instant-verifications ensureOrganizationAuthorization not checked as finalized immediately by the user (youth)
            var result = await _opportunityService.AllocateRewards(opportunity.Id, !instantVerification);
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

            if (result.ZltoRewardPoolDepleted == true)
              item.CommentVerification = CommentVerificationAppendInfo(item.CommentVerification, "ZLTO not awarded as reward pool has been depleted");
            else if (result.ZltoRewardReduced == true)
              item.CommentVerification = CommentVerificationAppendInfo(item.CommentVerification, "ZLTO partially awarded due to insufficient reward pool");

            if (result.YomaRewardPoolDepleted == true)
              item.CommentVerification = CommentVerificationAppendInfo(item.CommentVerification, "Yoma not awarded as reward pool has been depleted");
            else if (result.YomaRewardReduced == true)
              item.CommentVerification = CommentVerificationAppendInfo(item.CommentVerification, "Yoma partially awarded due to insufficient reward pool");

            notificationType = NotificationType.Opportunity_Verification_Completed;
            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(status), $"Status of '{status}' not supported");
        }

        item = await _myOpportunityRepository.Update(item);

        scope.Complete();
      });

      if (!notificationType.HasValue)
        throw new InvalidOperationException($"Notification type expected");

      await SendNotification(item, notificationType.Value);
    }

    private void EnsureNoEarlierPendingVerificationsForOtherStudents(User user, Opportunity.Models.Opportunity opportunity, Models.MyOpportunity currentItem, bool instantVerification)
    {
      //ensure no pending verifications for other students who applied earlier

      if (instantVerification) return;

      var proceed = opportunity.ParticipantLimit.HasValue;
      if (!proceed) proceed = opportunity.ZltoRewardPool.HasValue;
      if (!proceed) return;

      var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
      var statusIdPending = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Pending.ToString()).Id;

      var itemsOlder = _myOpportunityRepository.Query(false)
        .Where(o => o.UserId != user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId && o.VerificationStatusId == statusIdPending &&
                    o.DateModified < currentItem.DateModified)
        .OrderBy(o => o.DateModified)
        .ThenBy(o => o.Id)
        .ToList();

      if (itemsOlder.Count == 0) return;

      throw new ValidationException($"Please complete the pending verifications for '{opportunity.Title}' for the following students who applied earlier: '{string.Join(", ", itemsOlder.Select(o => $"{o.UserDisplayName} ({o.DateModified:dd MMM yyyy})"))}'");
    }

    private static string CommentVerificationAppendInfo(string? currentComment, string info)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(info, nameof(info));

      return string.IsNullOrEmpty(currentComment) ? info : $"{currentComment}{". "}{info}";
    }

    private void SetEngagementCounts(MyOpportunityInfo result)
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

    private void PerformActionSendForVerificationParseCommitment(MyOpportunityRequestVerify request, Opportunity.Models.Opportunity opportunity)
    {
      if (request.DateStart.HasValue) request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.ToEndOfDay();

      if (request.DateStart.HasValue && request.DateStart.Value < opportunity.DateStart)
        throw new ValidationException($"Start date can not be earlier than the opportunity start date of '{opportunity.DateStart:yyyy-MM-dd}'");

      if (request.DateEnd.HasValue)
      {
        if (opportunity.DateEnd.HasValue && request.DateEnd.Value > opportunity.DateEnd.Value)
          throw new ValidationException($"End date cannot be later than the opportunity end date of '{opportunity.DateEnd.Value:yyyy-MM-dd}'");

        if (request.DateEnd.Value > DateTimeOffset.UtcNow.ToEndOfDay())
          throw new ValidationException($"End date cannot be in the future. Please select today's date or earlier");
      }

      TimeInterval? timeInterval;

      //validation should ensure either the start date or commitment interval is provided; failsafe ensuring commitement takes preference
      if (request.CommitmentInterval != null)
      {
        if (!request.DateEnd.HasValue) return;

        timeInterval = _timeIntervalService.GetById(request.CommitmentInterval.Id);

        request.CommitmentInterval.Option = Enum.Parse<TimeIntervalOption>(timeInterval.Name, true);

        var totalMinutes = TimeIntervalHelper.ConvertToMinutes(timeInterval.Name, request.CommitmentInterval.Count);
        request.DateStart = request.DateEnd.Value.AddMinutes(-totalMinutes).RemoveTime();

        return;
      }

      //validation should ensure both start (provided no commitment was specified) and end dates are provided; failsafe by not setting commitement if not provided
      if (!request.DateStart.HasValue || !request.DateEnd.HasValue) return;

      var (Interval, Count) = TimeIntervalHelper.ConvertToCommitmentInterval(request.DateStart.Value, request.DateEnd.Value);

      timeInterval = _timeIntervalService.GetByName(Interval.ToString());

      request.CommitmentInterval = new MyOpportunityRequestVerifyCommitmentInterval
      {
        Id = timeInterval.Id,
        Count = Count,
        Option = Enum.Parse<TimeIntervalOption>(timeInterval.Name, true)
      };
    }

    private async Task PerformActionSendForVerification(User user, Guid opportunityId, MyOpportunityRequestVerify request, VerificationMethod? requiredVerificationMethod)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _myOpportunityRequestValidatorVerify.ValidateAndThrowAsync(request);

      //provided opportunity is published (and started) or expired
      var opportunity = _opportunityService.GetById(opportunityId, true, true, false);
      var canSendForVerification = opportunity.Status == Status.Expired;
      if (!canSendForVerification) canSendForVerification = opportunity.Published && opportunity.DateStart <= DateTimeOffset.UtcNow;
      if (!canSendForVerification)
        throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be sent for verification"));

      PerformActionSendForVerificationParseCommitment(request, opportunity);

      if (!opportunity.VerificationEnabled)
        throw new ValidationException($"Opportunity '{opportunity.Title}' can not be completed / verification is not enabled");

      if (!opportunity.VerificationMethod.HasValue)
        throw new DataInconsistencyException($"Data inconsistency detected: The opportunity '{opportunity.Title}' has verification enabled, but no verification method is set");

      if (opportunity.VerificationMethod == VerificationMethod.Manual && (opportunity.VerificationTypes == null || opportunity.VerificationTypes.Count == 0))
        throw new DataInconsistencyException("Manual verification enabled but opportunity has no mapped verification types");

      if (requiredVerificationMethod.HasValue && opportunity.VerificationMethod != requiredVerificationMethod.Value)
        throw new ValidationException($"Opportunity '{opportunity.Title}' cannot be completed / requires verification method {requiredVerificationMethod}");

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
            throw new ValidationException($"Verification is already {myOpportunity.VerificationStatus?.ToString().ToLower()} for opportunity '{opportunity.Title}'. Please check your YoID for more information.");

          case VerificationStatus.Completed:
            throw new ValidationException($"Verification is already {myOpportunity.VerificationStatus?.ToString().ToLower()} for opportunity '{opportunity.Title}'. Please check your YoID for more information.");

          case VerificationStatus.Rejected: //can be re-send for verification
            break;

          default:
            throw new InvalidOperationException($"Unknown / unsupported '{nameof(myOpportunity.VerificationStatus)}' of '{myOpportunity.VerificationStatus.Value}'");
        }
      }

      myOpportunity.VerificationStatusId = verificationStatusPendingId;
      myOpportunity.CommitmentIntervalId = request.CommitmentInterval?.Id;
      myOpportunity.CommitmentIntervalCount = request.CommitmentInterval?.Count;
      myOpportunity.CommitmentInterval = request.CommitmentInterval?.Option;
      myOpportunity.DateStart = request.DateStart;
      myOpportunity.DateEnd = request.DateEnd;
      myOpportunity.Recommendable = request.Recommendable;
      myOpportunity.StarRating = request.StarRating;
      myOpportunity.Feedback = request.Feedback;

      await PerformActionSendForVerificationProcessVerificationTypes(request, opportunity, myOpportunity, isNew);

      //used by notifications
      myOpportunity.Username = user.Username;
      myOpportunity.UserPhoneNumber = user.PhoneNumber;
      myOpportunity.UserPhoneNumberConfirmed = user.PhoneNumberConfirmed;
      myOpportunity.UserEmail = user.Email;
      myOpportunity.UserEmailConfirmed = user.EmailConfirmed;
      myOpportunity.UserDisplayName = user.DisplayName ?? user.Username;
      myOpportunity.OpportunityTitle = opportunity.Title;
      myOpportunity.OrganizationId = opportunity.OrganizationId;
      myOpportunity.ZltoReward = opportunity.ZltoReward;
      myOpportunity.YomaReward = opportunity.YomaReward;

      if (request.InstantOrImportedVerification) return; //with instant or imported verifications, pending notifications are not sent

      //sent to youth
      await SendNotification(myOpportunity, NotificationType.Opportunity_Verification_Pending);

      //sent to organization admins
      await SendNotification(myOpportunity, NotificationType.Opportunity_Verification_Pending_Admin);
    }

    private async Task SendNotification(Models.MyOpportunity myOpportunity, NotificationType type)
    {
      try
      {
        List<NotificationRecipient>? recipients = null;

        recipients = type switch
        {
          NotificationType.Opportunity_Verification_Rejected or
          NotificationType.Opportunity_Verification_Completed or
          NotificationType.Opportunity_Verification_Pending =>
              [new() { Username = myOpportunity.Username, PhoneNumber = myOpportunity.UserPhoneNumber, PhoneNumberConfirmed = myOpportunity.UserPhoneNumberConfirmed,
                Email = myOpportunity.UserEmail, EmailConfirmed = myOpportunity.UserEmailConfirmed, DisplayName = myOpportunity.UserDisplayName }],

          NotificationType.Opportunity_Verification_Pending_Admin =>
              [.. _organizationService.ListAdmins(myOpportunity.OrganizationId, false, false).Select(o => new NotificationRecipient
              { Username = o.Username, PhoneNumber = o.PhoneNumber, PhoneNumberConfirmed = o.PhoneNumberConfirmed,
                Email = o.Email, EmailConfirmed = o.EmailConfirmed, DisplayName = o.DisplayName })],

          _ => throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported"),
        };

        var data = new NotificationOpportunityVerification
        {
          YoIDURL = _notificationURLFactory.OpportunityVerificationYoIDURL(type),
          VerificationURL = _notificationURLFactory.OpportunityVerificationURL(type, myOpportunity.OrganizationId),
          Opportunities = [
            new()
            {
              Title = myOpportunity.OpportunityTitle,
              DateStart = myOpportunity.DateStart,
              DateEnd = myOpportunity.DateEnd,
              Comment = myOpportunity.CommentVerification,
              URL = _notificationURLFactory.OpportunityVerificationItemURL(type, myOpportunity.OpportunityId, myOpportunity.OrganizationId),
              ZltoReward = myOpportunity.ZltoReward,
              YomaReward = myOpportunity.YomaReward
            }
            ]
        };

        await _notificationDeliveryService.Send(type, recipients, data);

        _logger.LogInformation("Successfully sent notification");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
      }
    }

    private async Task PerformActionSendForVerificationProcessVerificationTypes(MyOpportunityRequestVerify request,
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
          await PerformActionSendForVerificationProcessVerificationTypes(request, opportunity, myOpportunity, itemsNewBlobs);

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

    private async Task PerformActionSendForVerificationProcessVerificationTypes(MyOpportunityRequestVerify request,
      Opportunity.Models.Opportunity opportunity,
      Models.MyOpportunity myOpportunity,
      List<BlobObject> itemsNewBlobs)
    {
      if (request.InstantOrImportedVerification) return; //with instant or imported verifications bypass any verification type requirements
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

            blobObject = await _blobService.Create(request.Certificate, FileType.Certificates, StorageType.Private);
            break;

          case VerificationType.Picture:
            if (request.Picture == null)
              throw new ValidationException($"Verification type '{verificationType.Type}': Picture required");

            blobObject = await _blobService.Create(request.Picture, FileType.Photos, StorageType.Private);
            break;

          case VerificationType.VoiceNote:
            if (request.VoiceNote == null)
              throw new ValidationException($"Verification type '{verificationType.Type}': Voice note required");

            blobObject = await _blobService.Create(request.VoiceNote, FileType.VoiceNotes, StorageType.Private);
            break;

          case VerificationType.Video:
            if (request.Video == null)
              throw new ValidationException($"Verification type '{verificationType.Type}': Video required");

            blobObject = await _blobService.Create(request.Video, FileType.Videos, StorageType.Private);
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
