using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Referral.Extensions;
using Yoma.Core.Domain.Referral.Helpers;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;
using Yoma.Core.Domain.ShortLinkProvider;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ProgramService : IProgramService
  {
    #region Class Variables
    private readonly ILogger<ProgramService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IProgramStatusService _programStatusService;
    private readonly IOpportunityService _opportunityService;
    private readonly IBlobService _blobService;
    private readonly IUserService _userService;
    private readonly ILinkMaintenanceService _linkMaintenanceService;
    private readonly ICountryService _countryService;
    private readonly ILinkStatusService _linkStatusService;

    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly IShortLinkProviderClient _shortLinkProviderClient;

    private readonly ProgramSearchFilterValidator _programSearchFilterValidator;
    private readonly ProgramRequestValidatorCreate _programRequestValidatorCreate;
    private readonly ProgramRequestValidatorUpdate _programRequestValidatorUpdate;

    private readonly IRepository<ProgramCountry> _programCountryRepository;
    private readonly IRepositoryBatchedValueContainsWithNavigation<ReferralLink> _linkRepository;
    private readonly IRepositoryBatchedValueContainsWithNavigation<Program> _programRepository;
    private readonly IRepositoryWithNavigation<ProgramPathway> _programPathwayRepository;
    private readonly IRepositoryWithNavigation<ProgramPathwayStep> _programPathwayStepRepository;
    private readonly IRepository<ProgramPathwayTask> _programPathwayTaskRepository;

    private static readonly ProgramStatus[] Statuses_Updatable = [ProgramStatus.Active, ProgramStatus.Inactive, ProgramStatus.UnCompletable];
    private static readonly ProgramStatus[] Statuses_Activatable = [ProgramStatus.Inactive]; // Expired must go Inactive→fix→Active; LimitReached is locked
    private static readonly ProgramStatus[] Statuses_CanDelete = [ProgramStatus.Active, ProgramStatus.Inactive, ProgramStatus.UnCompletable];
    private static readonly ProgramStatus[] Statuses_DeActivatable = [ProgramStatus.Active, ProgramStatus.Expired]; // allow moving Expired→Inactive to edit
    #endregion

    #region Constrcutor
    #region Constrcutor
    public ProgramService(
      ILogger<ProgramService> logger,
      IOptions<AppSettings> appSettings,
      IHttpContextAccessor httpContextAccessor,

      IProgramStatusService programStatusService,
      IOpportunityService opportunityService,
      IBlobService blobService,
      IUserService userService,
      ILinkMaintenanceService linkMaintenanceService,
      ICountryService countryService,
      ILinkStatusService linkStatusService,

      IExecutionStrategyService executionStrategyService,
      IShortLinkProviderClientFactory shortLinkProviderClientFactory,

      ProgramSearchFilterValidator programSearchFilterValidator,
      ProgramRequestValidatorCreate programRequestValidatorCreate,
      ProgramRequestValidatorUpdate programRequestValidatorUpdate,

      IRepository<ProgramCountry> programCountryRepository,
      IRepositoryBatchedValueContainsWithNavigation<ReferralLink> linkRepository,
      IRepositoryBatchedValueContainsWithNavigation<Program> programRepository,
      IRepositoryWithNavigation<ProgramPathway> programPathwayRepository,
      IRepositoryWithNavigation<ProgramPathwayStep> programPathwayStepRepository,
      IRepository<ProgramPathwayTask> programPathwayTaskRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _programStatusService = programStatusService ?? throw new ArgumentNullException(nameof(programStatusService));
      _opportunityService = opportunityService ?? throw new ArgumentNullException(nameof(opportunityService));
      _blobService = blobService ?? throw new ArgumentNullException(nameof(blobService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _linkMaintenanceService = linkMaintenanceService ?? throw new ArgumentNullException(nameof(linkMaintenanceService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _linkStatusService = linkStatusService ?? throw new ArgumentNullException(nameof(linkStatusService));

      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
      _shortLinkProviderClient = shortLinkProviderClientFactory.CreateClient() ?? throw new ArgumentNullException(nameof(shortLinkProviderClientFactory));

      _programSearchFilterValidator = programSearchFilterValidator ?? throw new ArgumentNullException(nameof(programSearchFilterValidator));
      _programRequestValidatorCreate = programRequestValidatorCreate ?? throw new ArgumentNullException(nameof(programRequestValidatorCreate));
      _programRequestValidatorUpdate = programRequestValidatorUpdate ?? throw new ArgumentNullException(nameof(programRequestValidatorUpdate));

      _programCountryRepository = programCountryRepository ?? throw new ArgumentNullException(nameof(programCountryRepository));
      _linkRepository = linkRepository ?? throw new ArgumentNullException(nameof(linkRepository));
      _programRepository = programRepository ?? throw new ArgumentNullException(nameof(programRepository));
      _programPathwayRepository = programPathwayRepository ?? throw new ArgumentNullException(nameof(programPathwayRepository));
      _programPathwayStepRepository = programPathwayStepRepository ?? throw new ArgumentNullException(nameof(programPathwayStepRepository));
      _programPathwayTaskRepository = programPathwayTaskRepository ?? throw new ArgumentNullException(nameof(programPathwayTaskRepository));
    }
    #endregion
    #endregion

    #region Public Membmers
    public Program GetById(Guid id, bool includeChildItems, bool includeComputed, LockMode? lockMode = null)
    {
      var result = GetByIdOrNull(id, includeChildItems, includeComputed, lockMode)
        ?? throw new EntityNotFoundException("This referral programme could not be found");

      return result;
    }

    public Program? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed, LockMode? lockMode = null)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var query = lockMode != null ? _programRepository.Query(includeChildItems, lockMode.Value) : _programRepository.Query(includeChildItems);

      var result = query.SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      if (includeComputed) result = ParseBlobObjectURL(result);

      return result;
    }

    public Program? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(name)) throw new ArgumentNullException(nameof(name));
      name = name.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var result = _programRepository.Query(includeChildItems).SingleOrDefault(o => o.Name.ToLower() == name.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (result == null) return null;

      if (includeComputed) result = ParseBlobObjectURL(result);

      return result;
    }

    public Program GetByLinkId(Guid linkId, bool includeChildItems, bool includeComputed)
    {
      var link = _linkMaintenanceService.GetById(linkId);

      return GetById(link.ProgramId, includeChildItems, includeComputed);
    }

    public Program? GetDefaultOrNull(bool includeChildItems, bool includeComputed)
    {
      var results = _programRepository.Query(includeChildItems).Where(o => o.IsDefault).ToList();
      if (results.Count > 1)
        throw new DataInconsistencyException($"Multiple {nameof(Program)} records are marked as default");

      var result = results.SingleOrDefault();
      if (result == null) return null;

      if (includeComputed) result = ParseBlobObjectURL(result);

      return result;
    }

    public List<Domain.Lookups.Models.Country> ListSearchCriteriaCountries(List<PublishedState>? publishedStates)
    {
      var worldwideCode = Country.Worldwide.ToDescription();
      var countryIdWorldwide = _countryService.GetByCodeAlpha2(worldwideCode).Id;
      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);
      var user = isAuthenticated ? _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false) : null;
      var userCountryId = user?.CountryId;

      // Anonymous users: only allow published state active (active + started), ignore input
      // Authenticated users: if none specified, default to published state active; else use provided list
      publishedStates = !isAuthenticated || publishedStates == null || publishedStates.Count == 0
        ? [PublishedState.Active]
        : publishedStates;

      // Authenticated users with a user country are restricted to [UserCountry + Worldwide].
      // Otherwise results remain unconstrained (discovery behavior).
      var resolvedCountryIds = ProgramCountryPolicy.ResolveAvailableCountriesForProgramSearch(countryIdWorldwide, isAuthenticated, userCountryId, null, false);

      var statusActiveId = _programStatusService.GetByName(ProgramStatus.Active.ToString()).Id;
      var statusExpiredId = _programStatusService.GetByName(ProgramStatus.Expired.ToString()).Id;

      var query = _programCountryRepository.Query();

      query = query.Where(o => o.ProgramHidden != true); //exclude hidden

      query = query.Where(o => !o.ProgramReferrerLimit.HasValue || (o.ProgramReferrerTotal ?? 0) < o.ProgramReferrerLimit); //exclude referrer limit reached

      // Authenticated users: exclude programs where the authenticated user (as referrer) already has an active link when the program does not allow multiple links
      if (user?.Id != null)
      {
        var queryLinks = _linkRepository.Query();
        var linkStatusActiveId = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString()).Id;

        query = query.Where(o => o.ProgramMultipleLinksAllowed || !queryLinks.Any(l => l.ProgramId == o.ProgramId && l.UserId == user.Id && l.StatusId == linkStatusActiveId));
      }

      if (resolvedCountryIds != null && resolvedCountryIds.Count != 0)
        query = query.Where(o => resolvedCountryIds.Contains(o.CountryId));

      var now = DateTimeOffset.UtcNow;
      var predicate = PredicateBuilder.False<ProgramCountry>();
      foreach (var state in publishedStates)
      {
        predicate = state switch
        {
          PublishedState.NotStarted => predicate.Or(o => o.ProgramStatusId == statusActiveId && o.ProgramDateStart > now),
          PublishedState.Active => predicate.Or(o => o.ProgramStatusId == statusActiveId && o.ProgramDateStart <= now),
          PublishedState.Expired => predicate.Or(o => o.ProgramStatusId == statusExpiredId),
          _ => throw new ArgumentOutOfRangeException(nameof(publishedStates), $"Published state '{state}' is not supported"),
        };
      }

      query = query.Where(predicate);

      var countryPrograms = query
       .GroupBy(o => o.CountryId)
       .Select(g => new { CountryId = g.Key, ProgramCount = g.Count() })
       .ToList();

      var countries = _countryService.List()
        .Where(o => countryPrograms.Select(co => co.CountryId).Contains(o.Id))
        .ToList();

      var results = countries
        .OrderByDescending(c => c.CodeAlpha2 == worldwideCode) //ensure Worldwide appears first
        .ThenByDescending(c => userCountryId != null && c.Id == userCountryId) //followed by the user's country if available and has one or more programs mapped
        .ThenByDescending(c => countryPrograms.FirstOrDefault(co => co.CountryId == c.Id)?.ProgramCount ?? 0) //followed by the remaining countries with programs, ordered by program counts descending
        .ThenBy(o => o.Name) //lastly alphabetically by name
        .ToList();

      return results;
    }

    public List<Domain.Lookups.Models.Country> ListSearchCriteriaCountriesAdmin()
    {
      var worldwideCode = Country.Worldwide.ToDescription();

      var query = _programCountryRepository.Query();

      var countryPrograms = query
       .GroupBy(o => o.CountryId)
       .Select(g => new { CountryId = g.Key, ProgramCount = g.Count() })
       .ToList();

      var countries = _countryService.List()
       .Where(o => countryPrograms.Select(co => co.CountryId).Contains(o.Id))
       .ToList();

      var results = countries
      .OrderByDescending(c => c.CodeAlpha2 == worldwideCode) //ensure Worldwide appears first
      .ThenByDescending(c => countryPrograms.FirstOrDefault(co => co.CountryId == c.Id)?.ProgramCount ?? 0) //followed by the remaining countries with programs, ordered by program counts descending
      .ThenBy(o => o.Name) //lastly alphabetically by name
      .ToList();

      return results;
    }

    public ProgramSearchResults Search(ProgramSearchFilterAdmin filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _programSearchFilterValidator.ValidateAndThrow(filter);

      var query = _programRepository.Query(true);

      //countries
      if (filter.Countries?.Count > 0)
      {
        filter.Countries = [.. filter.Countries.Distinct()];

        var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
        var includesWorldwide = filter.Countries.Contains(countryIdWorldwide);

        var queryProgramCountries = _programCountryRepository.Query();

        query = query.Where(program =>
          // explicit match
          queryProgramCountries.Any(programCountry => programCountry.ProgramId == program.Id && filter.Countries.Contains(programCountry.CountryId))
          // implicit world-wide (no country rows) ONLY if filter includes world-wide
          || (includesWorldwide && !queryProgramCountries.Any(programCountry => programCountry.ProgramId == program.Id)));
      }

      //valueContains
      if (!string.IsNullOrEmpty(filter.ValueContains))
      {
        filter.ValueContains = filter.ValueContains.Trim();
        query = _programRepository.Contains(query, filter.ValueContains);
      }

      if (filter.PublishedStates != null)
      {
        var statusActiveId = _programStatusService.GetByName(ProgramStatus.Active.ToString()).Id;
        var statusExpiredId = _programStatusService.GetByName(ProgramStatus.Expired.ToString()).Id;

        var now = DateTimeOffset.UtcNow;
        var predicate = PredicateBuilder.False<Program>();
        foreach (var state in filter.PublishedStates)
        {
          predicate = state switch
          {
            PublishedState.NotStarted => predicate.Or(o => o.StatusId == statusActiveId && o.DateStart > now),
            PublishedState.Active => predicate.Or(o => o.StatusId == statusActiveId && o.DateStart <= now),
            PublishedState.Expired => predicate.Or(o => o.StatusId == statusExpiredId),
            _ => throw new InvalidOperationException($"Published state '{state}' is not supported"),
          };
        }

        query = query.Where(predicate);
      }

      //date range
      if (filter.DateStart.HasValue)
      {
        filter.DateStart = filter.DateStart.Value.RemoveTime();
        query = query.Where(o => o.DateStart >= filter.DateStart.Value);
      }

      if (filter.DateEnd.HasValue)
      {
        filter.DateEnd = filter.DateEnd.Value.ToEndOfDay();
        query = query.Where(o => o.DateEnd <= filter.DateEnd.Value);
      }

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = [.. filter.Statuses.Distinct()];
        var statusIds = filter.Statuses.Select(o => _programStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      //excludeHidden
      if (filter.ExcludeHidden)
        query = query.Where(o => o.Hidden != true);

      //excludeReferrerLimitReached
      if (filter.ExcludeReferrerLimitReached)
        query = query.Where(o => o.ReferrerLimit == null || (o.ReferrerTotal ?? 0) < o.ReferrerLimit);

      //userIdReferrer: authenticated user acting as referrer; exclude programs where referrer already has an active link when multiple links are not allowed
      if (filter.UserIdReferrer.HasValue)
      {
        var statusActiveId = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString()).Id;

        var queryLinks = _linkRepository.Query();
        query = query.Where(o => o.MultipleLinksAllowed || !queryLinks.Any(l => l.ProgramId == o.Id && l.UserId == filter.UserIdReferrer.Value && l.StatusId == statusActiveId));
      }

      var results = new ProgramSearchResults();

      if (filter.TotalCountOnly)
      {
        results.TotalCount = query.Count();
        return results;
      }

      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id);

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];
      results.Items.ForEach(o => ParseBlobObjectURL(o));

      return results;
    }

    public async Task<Program> Create(ProgramRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _programRequestValidatorCreate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateStart < DateTimeOffset.UtcNow.RemoveTime())
        throw new ValidationException("The start date cannot be in the past, it can be today or later");

      if (request.DateEnd.HasValue)
      {
        request.DateEnd = request.DateEnd.Value.ToEndOfDay();

        if (request.CompletionWindowInDays.HasValue && request.DateStart.AddDays(request.CompletionWindowInDays.Value) > request.DateEnd.Value)
          throw new ValidationException(
            "The completion window exceeds the programme end date. Based on the selected start and end dates, the maximum allowed completion window is " +
            $"{(request.DateEnd.Value - request.DateStart).Days} days");
      }

      var existingByName = GetByNameOrNull(request.Name, false, false);
      if (existingByName != null)
        throw new ValidationException("A referral programme with this name already exists");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var result = new Program
      {
        Name = request.Name,
        Summary = request.Summary,
        Description = request.Description,
        CompletionWindowInDays = request.CompletionWindowInDays,
        CompletionLimitReferee = request.CompletionLimitReferee,
        CompletionLimit = request.CompletionLimit,
        ZltoRewardReferrer = request.ZltoRewardReferrer,
        ZltoRewardReferee = request.ZltoRewardReferee,
        ZltoRewardPool = request.ZltoRewardPool,
        ProofOfPersonhoodRequired = request.ProofOfPersonhoodRequired,
        PathwayRequired = request.PathwayRequired,
        MultipleLinksAllowed = request.MultipleLinksAllowed,
        StatusId = _programStatusService.GetByName(ProgramStatus.Active.ToString()).Id,
        Status = ProgramStatus.Active,
        IsDefault = false, //processed below if true
        Hidden = request.Hidden,
        ReferrerLimit = request.ReferrerLimit,
        DateStart = request.DateStart,
        DateEnd = request.DateEnd,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id
      };

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        //create the program
        result = await _programRepository.Create(result);

        //countries
        result = await AssignCountries(result, request.Countries);

        //set as default
        if (request.IsDefault)
        {
          var outcome = await SetAsDefault(result);
          if (outcome.Updated) result = outcome.Program;
        }

        //pathway
        if (request.Pathway != null) result = await UpsertProgramPathway(result, request.Pathway);

        scope.Complete();
      });

      return result;
    }

    public async Task<Program> Update(ProgramRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _programRequestValidatorUpdate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.Value.ToEndOfDay();

      var result = GetById(request.Id, true, true);
      var now = DateTimeOffset.UtcNow;

      AssertUpdatable(result);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Updating Program {ProgramId}. Current(Status={Status}, Start={Start:yyyy-MM-dd}, End={End:yyyy-MM-dd}, Limit={Limit}, Total={Total}) Requested(Start={RStart:yyyy-MM-dd}, End={REnd:yyyy-MM-dd}, Limit={RLimit})",
        result.Id, result.Status, result.DateStart, result.DateEnd, result.CompletionLimit, result.CompletionTotal, request.DateStart, request.DateEnd, request.CompletionLimit);

      var existingByName = GetByNameOrNull(request.Name, false, false);
      if (existingByName != null && result.Id != existingByName.Id)
        throw new ValidationException("A referral programme with this name already exists");

      var startDateUpdated = !result.DateStart.Equals(request.DateStart);
      if (startDateUpdated && request.DateStart < now.RemoveTime())
        throw new ValidationException("The start date cannot be in the past. The start date has been updated and must be today or later");

      var endDateUpdated = !Nullable.Equals(request.DateEnd, result.DateEnd);
      var completionWindowUpdated = !Nullable.Equals(request.CompletionWindowInDays, result.CompletionWindowInDays);

      if ((startDateUpdated || endDateUpdated || completionWindowUpdated)
        && request.DateEnd.HasValue && request.CompletionWindowInDays.HasValue
        && request.DateStart.AddDays(request.CompletionWindowInDays.Value) > request.DateEnd.Value)
      {
        throw new ValidationException(
          "The completion window exceeds the programme end date. Based on the selected start and end dates, the maximum allowed completion window is " +
          $"{(request.DateEnd.Value - request.DateStart).Days} days");
      }

      // If DateEnd is in the past/now, immediately expire 
      if (request.DateEnd.HasValue && request.DateEnd.Value <= now)
      {
        result.Status = ProgramStatus.Expired;
        result.StatusId = _programStatusService.GetByName(ProgramStatus.Expired.ToString()).Id;

        //notification not send NotificationType.ReferralProgram_Expiration_Expired (sent to admin); explicit admin action
      }
      // If program was UnCompletable but the edit makes it healthy, flip to Active provided not limit reached
      else if (result.Status == ProgramStatus.UnCompletable)
      {
        if (request.CompletionLimit.HasValue && (result.CompletionTotal ?? 0) >= request.CompletionLimit.Value)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Program {ProgramId} edited from UnCompletable -> LimitReached (cap hit: {CompletionTotal}/{CompletionLimit})",
            result.Id, result.CompletionTotal, request.CompletionLimit);

          result.Status = ProgramStatus.LimitReached;
          result.StatusId = _programStatusService.GetByName(ProgramStatus.LimitReached.ToString()).Id;
        }
        else
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Program {ProgramId} edited from UnCompletable -> Active", result.Id);

          result.Status = ProgramStatus.Active;
          result.StatusId = _programStatusService.GetByName(ProgramStatus.Active.ToString()).Id;
        }
      }

      if (request.ZltoRewardPool.HasValue && result.ZltoRewardCumulative.HasValue && request.ZltoRewardPool.Value < result.ZltoRewardCumulative.Value)
        throw new ValidationException($"The Zlto reward pool cannot be less than the cumulative Zlto rewards ({result.ZltoRewardCumulative.Value:F0}) already allocated to participants");

      if (request.CompletionLimitReferee.HasValue && request.CompletionLimit.HasValue && request.CompletionLimitReferee.Value > request.CompletionLimit.Value)
        throw new ValidationException($"The per-referrer completion limit cannot exceed the overall completion limit of {request.CompletionLimit.Value}");

      if (request.CompletionLimit.HasValue && result.CompletionTotal.HasValue && request.CompletionLimit.Value < result.CompletionTotal.Value)
        throw new ValidationException($"The overall completion limit cannot be lower than the total completions already recorded ({result.CompletionTotal.Value:F0})");

      if (request.ReferrerLimit.HasValue && result.ReferrerTotal.HasValue && request.ReferrerLimit.Value < result.ReferrerTotal.Value)
        throw new ValidationException($"The referrer limit cannot be lower than the total referrers already recorded ({result.ReferrerTotal.Value:F0})");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var pathwayRemoved = result.Pathway != null && request.Pathway == null;
      var popRemoved = result.ProofOfPersonhoodRequired && !request.ProofOfPersonhoodRequired;

      result.Name = request.Name;
      result.Summary = request.Summary;
      result.Description = request.Description;
      result.CompletionWindowInDays = request.CompletionWindowInDays;
      result.CompletionLimitReferee = request.CompletionLimitReferee;
      result.CompletionLimit = request.CompletionLimit;
      result.ZltoRewardReferrer = request.ZltoRewardReferrer;
      result.ZltoRewardReferee = request.ZltoRewardReferee;
      result.ZltoRewardPool = request.ZltoRewardPool;
      result.ProofOfPersonhoodRequired = request.ProofOfPersonhoodRequired;
      result.PathwayRequired = request.PathwayRequired;
      result.MultipleLinksAllowed = request.MultipleLinksAllowed;
      //status processed above
      if (!request.IsDefault) result.IsDefault = false; //processed below if true to avoid unique index constraint
      // Hidden is controlled via a dedicated UI action. If not supplied in the request, preserve the existing value
      result.Hidden = request.Hidden.HasValue ? request.Hidden : result.Hidden;
      result.ReferrerLimit = request.ReferrerLimit;
      result.DateStart = request.DateStart;
      result.DateEnd = request.DateEnd;
      result.ModifiedByUserId = user.Id;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        // countries
        result = await RemoveCountries(result, result.Countries?.Select(o => o.Id).Except(request.Countries ?? []).ToList());
        result = await AssignCountries(result, request.Countries);

        //pathway
        if (request.Pathway == null)
          result = await DeleteProgramPathway(result);
        else
        {
          result = await DeletePathwayChildren(result, request.Pathway);
          result = await UpsertProgramPathway(result, request.Pathway);
        }

        //update the program
        result = await _programRepository.Update(result);

        //set as default
        if (request.IsDefault)
        {
          var outcome = await SetAsDefault(result);
          if (outcome.Updated) result = outcome.Program;
        }

        if (result.Status == ProgramStatus.Expired)
          await _linkMaintenanceService.ExpireByProgramId([result.Id], _logger);
        else if (result.Status == ProgramStatus.LimitReached)
          await _linkMaintenanceService.LimitReachedByProgramId([result.Id], _logger);

        scope.Complete();
      });

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Program {ProgramId} updated. FinalStatus={Status}", result.Id, result.Status);

      // Trigger sweep: reprocess pending usages when completion requirements are reduced (POP / Pathway removed)
      if (result.Status == ProgramStatus.Active && (popRemoved || pathwayRemoved))
        await _linkMaintenanceService.ProcessUsageProgressByProgramId(result.Id, _logger);

      return result;
    }

    public async Task UpdateHidden(Guid id, bool hidden)
    {
      var item = GetById(id, false, false);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      AssertUpdatable(item);

      if (hidden && item.IsDefault)
        throw new ValidationException("The default referral programme cannot be hidden");

      item.Hidden = hidden;
      item.ModifiedByUserId = user.Id;

      await _programRepository.Update(item);
    }

    public async Task<Program> UpdateImage(Guid id, IFormFile file)
    {
      var result = GetById(id, false, true);

      AssertUpdatable(result);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      (Program? Program, BlobObject? ItemAdded) resultImage = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);
        resultImage = await UpdateImage(result, file);
        result.ModifiedByUserId = user.Id;
        result = await _programRepository.Update(result);
        scope.Complete();
      });

      if (resultImage.Program == null)
        throw new InvalidOperationException($"{nameof(Program)} expected");

      return resultImage.Program;
    }

    public async Task UpdateStatus(Guid id, ProgramStatus status)
    {
      var item = GetById(id, true, false);
      var now = DateTimeOffset.UtcNow;

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      bool cancelReferralLinks = false;
      bool flipLinksToLimitReached = false;

      var originalStatus = item.Status;
      var finalStatus = status;

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("UpdateStatus requested for Program {ProgramId}. Requested={Requested} Current={Current} End={End} CompletionLimit={CompletionLimit} CompletionTotal={CompletionTotal}",
        item.Id, status, item.Status, item.DateEnd?.ToString("yyyy-MM-dd") ?? "(null)", item.CompletionLimit, item.CompletionTotal);

      switch (status)
      {
        case ProgramStatus.Active:
          if (item.Status == ProgramStatus.Active) return;
          if (!Statuses_Activatable.Contains(item.Status))
            throw new ValidationException("This referral programme cannot be activated right now");

          //ensure DateEnd was updated for re-activation of previously expired program
          if (item.DateEnd.HasValue && item.DateEnd.Value <= now)
            throw new ValidationException("This referral programme cannot be activated because its end date is in the past");

          EnsurePathwayIsCompletableOrThrow(item.Pathway);

          if (item.CompletionLimit.HasValue && (item.CompletionTotal ?? 0) >= item.CompletionLimit.Value)
          {
            finalStatus = ProgramStatus.LimitReached;
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Program {ProgramId} activation resolved to LimitReached (cap hit: {Total}/{Limit})", item.Id, item.CompletionTotal, item.CompletionLimit);

            flipLinksToLimitReached = true;
          }
          else
            finalStatus = ProgramStatus.Active;
          break;

        case ProgramStatus.Inactive:
          // existing referral links remain usable and can still be completed, but new links cannot be created
          if (item.Status == ProgramStatus.Inactive) return;
          if (!Statuses_DeActivatable.Contains(item.Status))
            throw new ValidationException("This referral programme cannot be deactivated right now");

          break;

        case ProgramStatus.Deleted:
          if (item.Status == ProgramStatus.Deleted) return;
          if (!Statuses_CanDelete.Contains(item.Status))
            throw new ValidationException("This referral programme cannot be deleted right now");

          cancelReferralLinks = true;

          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(ProgramStatus)} of '{status.ToDescription()}' not supported");
      }

      if (finalStatus == originalStatus && !cancelReferralLinks && !flipLinksToLimitReached) return;

      var statusId = _programStatusService.GetByName(finalStatus.ToString()).Id;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        item.StatusId = statusId;
        item.Status = finalStatus;
        item.ModifiedByUserId = user.Id;

        item = await _programRepository.Update(item);

        if (cancelReferralLinks)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Cancelling all referral links for program {ProgramId}", item.Id);
          await _linkMaintenanceService.CancelByProgramId(item.Id);
        }
        else if (flipLinksToLimitReached)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Flipping links to limit-reached for program {ProgramId}", item.Id);
          await _linkMaintenanceService.LimitReachedByProgramId(item.Id, _logger);
        }

        scope.Complete();
      });

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Program {ProgramId} status updated. Requested={Requested} Final={Final}", item.Id, status, finalStatus);
    }

    public async Task SetAsDefault(Guid id)
    {
      var item = GetById(id, false, false);

      AssertUpdatable(item);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        var outcome = await SetAsDefault(item);
        if (!outcome.Updated) return;

        item = outcome.Program;
        item.ModifiedByUserId = user.Id;
        item = await _programRepository.Update(item);

        scope.Complete();
      });
    }

    public async Task<Program> ProcessCompletion(Program program, decimal? rewardAmount)
    {
      ArgumentNullException.ThrowIfNull(program, nameof(program));

      var statusLimitReached = _programStatusService.GetByName(ProgramStatus.LimitReached.ToString());

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();

        // Increment global completion total (always)
        program.CompletionTotal = (program.CompletionTotal ?? 0) + 1;

        // Only init (if needed) and add reward if any reward
        if (rewardAmount.HasValue && rewardAmount.Value > 0m)
          program.ZltoRewardCumulative = (program.ZltoRewardCumulative ?? 0m) + rewardAmount.Value;

        // Only flip to LimitReached if:
        //  • cap is configured
        //  • total >= cap
        //  • program currently Active
        if (program.Status == ProgramStatus.Active &&
            program.CompletionLimit.HasValue &&
            program.CompletionTotal >= program.CompletionLimit.Value)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
            "Referral program {ProgramId}: global completion cap reached (total {Total} >= limit {Limit}) — flipping to LIMIT_REACHED",
            program.Id, program.CompletionTotal, program.CompletionLimit.Value);

          program.Status = ProgramStatus.LimitReached;
          program.StatusId = statusLimitReached.Id;

          await _linkMaintenanceService.LimitReachedByProgramId(program.Id, _logger);
        }
        else
        {
          if (_logger.IsEnabled(LogLevel.Debug)) _logger.LogDebug(
            "Referral program {ProgramId}: totals updated (total {Total}, rewardΔ {RewardDelta}); status remains {Status} (cap {Cap}, active={IsActive})",
            program.Id, program.CompletionTotal, rewardAmount ?? 0m, program.Status,
            program.CompletionLimit?.ToString() ?? "null", program.Status == ProgramStatus.Active);
        }

        program = await _programRepository.Update(program);

        scope.Complete();
      });

      return program;
    }

    public async Task<Program> ReferrerLinkCreated(Program program, bool existingReferrer)
    {
      ArgumentNullException.ThrowIfNull(program, nameof(program));

      // User already counted as a referrer for this program — nothing to update
      if (existingReferrer) return program;

      // Enforce limit / cap if configured
      if (program.ReferrerLimit.HasValue && (program.ReferrerBalance ?? 0) <= 0)
        throw new ValidationException("This referral programme has reached its limit");

      program.ReferrerTotal = (program.ReferrerTotal ?? 0) + 1;

      program = await _programRepository.Update(program);

      return program;
    }

    public async Task<ProgramLinkReferrer> GetOrCreateShortLinkReferrer(Guid Id, bool? includeQRCode)
    {
      var program = GetById(Id, false, false);

      var url = program.ReferrerURL(_appSettings.AppBaseURL);

      program = await GenerateShortLinkReferrer(program, url);

      return new ProgramLinkReferrer
      {
        Id = Id,
        URL = url,
        ShortUrl = program.ReferrerShortURL!,
        QRCodeBase64 = includeQRCode == true ? QRCodeHelper.GenerateQRCodeBase64(program.ReferrerShortURL!) : null
      };
    }

    #endregion

    #region Private Members
    private async Task<Program> GenerateShortLinkReferrer(Program program, string? url)
    {
      // No locking applied here:
      // - Admin-only, low-frequency operation
      // - Duplicate short-link generation across instances is acceptable (last write wins)
      // - Distributed locking would be overkill for this use case

      if (!string.IsNullOrEmpty(program.ReferrerShortURL)) return program;

      AssertUpdatable(program);

      url = url?.Trim();
      if (string.IsNullOrEmpty(url)) url = program.ReferrerURL(_appSettings.AppBaseURL);

      var responseShortLink = await _shortLinkProviderClient.CreateShortLink(new ShortLinkRequest
      {
        Type = LinkType.ReferralProgram,
        Action = LinkAction.Share,
        Title = program.Name,
        URL = url
      });

      program.ReferrerShortURL = responseShortLink.Link;

      await _programRepository.Update(program);

      return program;
    }

    private async Task<Program> AssignCountries(Program program, List<Guid>? countryIds)
    {
      if (countryIds == null || countryIds.Count == 0)
        throw new ArgumentNullException(nameof(countryIds));

      countryIds = [.. countryIds.Distinct()];

      var results = new List<Domain.Lookups.Models.Country>();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();
        foreach (var countryId in countryIds)
        {
          var country = _countryService.GetById(countryId);
          results.Add(country);

          var item = _programCountryRepository.Query().SingleOrDefault(o => o.ProgramId == program.Id && o.CountryId == country.Id);

          if (item != null) continue;
          item = new ProgramCountry
          {
            ProgramId = program.Id,
            CountryId = country.Id
          };

          await _programCountryRepository.Create(item);

          program.Countries ??= [];
          program.Countries.Add(new Domain.Lookups.Models.Country { Id = country.Id, Name = country.Name, CodeAlpha2 = country.CodeAlpha2, CodeAlpha3 = country.CodeAlpha3, CodeNumeric = country.CodeNumeric });
        }

        scope.Complete();
      });

      return program;
    }

    private async Task<Program> RemoveCountries(Program program, List<Guid>? countryIds)
    {
      if (countryIds == null || countryIds.Count == 0) return program;

      countryIds = [.. countryIds.Distinct()];

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();
        foreach (var countryId in countryIds)
        {
          var country = _countryService.GetById(countryId);

          var item = _programCountryRepository.Query().SingleOrDefault(o => o.ProgramId == program.Id && o.CountryId == country.Id);
          if (item == null) continue;

          await _programCountryRepository.Delete(item);

          program.Countries?.Remove(program.Countries.Single(o => o.Id == country.Id));
        }

        scope.Complete();
      });

      return program;
    }

    private static void EnsurePathwayIsCompletableOrThrow(ProgramPathway? pathway)
    {
      if (pathway == null) return;

      if (pathway.IsCompletable) return;

      var stepMessages = new List<string>();

      foreach (var step in pathway.Steps?.Where(s => !s.IsCompletable) ?? [])
      {
        var taskReasons = step.Tasks?
          .Where(t => !t.IsCompletable)
          .Select(t => t.NonCompletableReason!)
          .ToList() ?? [];

        var combinedReasons = string.Join(", ", taskReasons);
        stepMessages.Add($"step '{step.Name}' is not completable: {combinedReasons}");
      }

      var message = $"This referral programme pathway cannot be completed because {string.Join(", ", stepMessages)}";
      throw new ValidationException(message);
    }

    private static void AssertUpdatable(Program program)
    {
      if (!Statuses_Updatable.Contains(program.Status))
        throw new ValidationException("This referral programme can no longer be updated");
    }

    private Program ParseBlobObjectURL(Program program)
    {
      if (program.ImageStorageType.HasValue && !string.IsNullOrEmpty(program.ImageKey))
        program.ImageURL = _blobService.GetURL(program.ImageStorageType.Value, program.ImageKey);

      program.Pathway?.Steps?.ForEach(s => s.Tasks?.ForEach(t =>
      {
        switch (t.EntityType)
        {
          case PathwayTaskEntityType.Opportunity:
            if (t.Opportunity == null) break;

            if (!string.IsNullOrEmpty(t.Opportunity.OrganizationLogoURL)) break;

            if (!t.Opportunity.OrganizationLogoStorageType.HasValue) break;
            if (string.IsNullOrEmpty(t.Opportunity.OrganizationLogoKey)) break;

            t.Opportunity.OrganizationLogoURL = _blobService.GetURL(t.Opportunity.OrganizationLogoStorageType.Value, t.Opportunity.OrganizationLogoKey);
            break;

          default:
            throw new InvalidOperationException($"Entity type of '{t.EntityType}' is not supported");
        }
      }));

      return program;
    }

    private async Task<Program> DeleteProgramPathway(Program program)
    {
      if (program.Pathway == null) return program;

      var pathway = program.Pathway;

      pathway.Steps ??= [];

      foreach (var step in pathway.Steps.ToList())
      {
        step.Tasks ??= [];

        foreach (var task in step.Tasks.ToList())
          await _programPathwayTaskRepository.Delete(task);

        await _programPathwayStepRepository.Delete(step);
      }

      await _programPathwayRepository.Delete(pathway);

      program.Pathway = null;
      return program;
    }

    private async Task<Program> DeletePathwayChildren(Program program, ProgramPathwayRequestUpsert request)
    {
      if (program.Pathway == null) return program;

      var pathway = program.Pathway;

      pathway.Steps ??= [];

      var requestStepIds = request.Steps.Where(s => s.Id.HasValue).Select(s => s.Id!.Value).ToHashSet();
      var stepsToDelete = pathway.Steps.Where(s => !requestStepIds.Contains(s.Id)).ToList();

      //deleted steps and related tasks
      foreach (var step in stepsToDelete)
      {
        step.Tasks ??= [];

        foreach (var task in step.Tasks.ToList())
          await _programPathwayTaskRepository.Delete(task);

        await _programPathwayStepRepository.Delete(step);
        pathway.Steps.Remove(step);
      }

      //deleted tasks for steps preserved
      foreach (var stepReq in request.Steps.Where(s => s.Id.HasValue))
      {
        var step = pathway.Steps.SingleOrDefault(s => s.Id == stepReq.Id!.Value);
        if (step == null) continue;
        step.Tasks ??= [];

        var reqTaskIds = stepReq.Tasks.Where(t => t.Id.HasValue).Select(t => t.Id!.Value).ToHashSet();
        var tasksToDelete = step.Tasks.Where(t => !reqTaskIds.Contains(t.Id)).ToList();

        foreach (var task in tasksToDelete)
        {
          await _programPathwayTaskRepository.Delete(task);
          step.Tasks.Remove(task);
        }
      }

      program.Pathway = pathway;
      return program;
    }

    private async Task<Program> UpsertProgramPathway(Program program, ProgramPathwayRequestUpsert request)
    {
      //pathway name is implicitly unique per program — currently a program can only have one pathway
      var resultPathway = program.Pathway;
      if (resultPathway == null)
      {
        //program has no pathway, but the request includes an existing pathway
        if (request.Id.HasValue)
          throw new ValidationException("This referral programme does not have a pathway to update");

        resultPathway = new ProgramPathway
        {
          ProgramId = program.Id,
          Name = request.Name,
          Description = request.Description,
          Rule = request.Rule,
          OrderMode = request.OrderMode
        };

        resultPathway = await _programPathwayRepository.Create(resultPathway);
      }
      else
      {
        if (!request.Id.HasValue)
          throw new ValidationException("This referral programme already has a pathway");

        //program has an existing pathway, but the request references a different one
        if (resultPathway.Id != request.Id)
          throw new ValidationException("The specified pathway does not match this referral programme");

        resultPathway.Name = request.Name;
        resultPathway.Description = request.Description;
        resultPathway.Rule = request.Rule;
        resultPathway.OrderMode = request.OrderMode;

        resultPathway = await _programPathwayRepository.Update(resultPathway);
      }

      program.Pathway = await UpsertProgramPathwaySteps(resultPathway, request.Steps);

      // Push effective program country policy down to tasks for validation
      program.Pathway.Steps?.SelectMany(s => s?.Tasks ?? []).ToList().ForEach(t => t.ProgramCountries = program.Countries);

      EnsurePathwayIsCompletableOrThrow(program.Pathway);

      return program;
    }

    private async Task<ProgramPathway> UpsertProgramPathwaySteps(ProgramPathway pathway, List<ProgramPathwayStepRequestUpsert> requests)
    {
      //step names already validated – persisted steps will match the request
      pathway.Steps ??= [];
      var resultSteps = new List<ProgramPathwayStep>();

      //set display order to match request sequence
      for (int i = 0; i < requests.Count; i++) requests[i].OrderDisplay = (short)(i + 1);

      //updates before inserts – prevents unique constraint conflicts
      foreach (var request in requests.Where(r => r.Id.HasValue))
      {
        var resultStep = pathway.Steps.Single(s => s.Id == request.Id);
        resultStep.Name = request.Name;
        resultStep.Description = request.Description;
        resultStep.Rule = request.Rule;
        resultStep.OrderMode = request.OrderMode;
        resultStep.Order = pathway.OrderMode == PathwayOrderMode.Sequential ? request.OrderDisplay : null;
        resultStep.OrderDisplay = request.OrderDisplay;

        resultStep = await _programPathwayStepRepository.Update(resultStep);
        resultStep = await UpsertProgramPathwayTasks(resultStep, request.Tasks);
        resultSteps.Add(resultStep);
      }

      //process inserts second
      foreach (var request in requests.Where(r => !r.Id.HasValue))
      {
        var resultStep = new ProgramPathwayStep
        {
          PathwayId = pathway.Id,
          Name = request.Name,
          Description = request.Description,
          Rule = request.Rule,
          OrderMode = request.OrderMode,
          Order = pathway.OrderMode == PathwayOrderMode.Sequential ? request.OrderDisplay : null,
          OrderDisplay = request.OrderDisplay
        };

        resultStep = await _programPathwayStepRepository.Create(resultStep);
        resultStep = await UpsertProgramPathwayTasks(resultStep, request.Tasks);
        resultSteps.Add(resultStep);
      }

      //reorder to match final display order
      pathway.Steps = [.. resultSteps.OrderBy(s => s.OrderDisplay)];
      return pathway;
    }

    private async Task<ProgramPathwayStep> UpsertProgramPathwayTasks(ProgramPathwayStep step, List<ProgramPathwayTaskRequestUpsert> requests)
    {
      //tasks already validated – persisted tasks will match the request
      step.Tasks ??= [];
      var resultTasks = new List<ProgramPathwayTask>();

      //set display order to match request sequence
      for (int i = 0; i < requests.Count; i++) requests[i].OrderDisplay = (short)(i + 1);

      //updates before inserts – prevents unique constraint conflicts
      foreach (var request in requests.Where(o => o.Id.HasValue))
      {
        var resultTask = step.Tasks.Single(t => t.Id == request.Id);
        resultTask.EntityType = request.EntityType;
        resultTask.Order = step.OrderMode == PathwayOrderMode.Sequential ? request.OrderDisplay : null;
        resultTask.OrderDisplay = request.OrderDisplay;
        resultTask = ParseTaskEntity(resultTask, request);

        resultTask = await _programPathwayTaskRepository.Update(resultTask);
        resultTasks.Add(resultTask);
      }

      //process inserts second
      foreach (var request in requests.Where(o => !o.Id.HasValue))
      {
        var resultTask = new ProgramPathwayTask
        {
          StepId = step.Id,
          EntityType = request.EntityType,
          Order = step.OrderMode == PathwayOrderMode.Sequential ? request.OrderDisplay : null,
          OrderDisplay = request.OrderDisplay
        };
        resultTask = ParseTaskEntity(resultTask, request);

        resultTask = await _programPathwayTaskRepository.Create(resultTask);
        resultTasks.Add(resultTask);
      }

      //reorder to match final display order
      step.Tasks = [.. resultTasks.OrderBy(s => s.OrderDisplay)];
      return step;
    }

    private ProgramPathwayTask ParseTaskEntity(ProgramPathwayTask task, ProgramPathwayTaskRequestUpsert request)
    {
      switch (request.EntityType)
      {
        case PathwayTaskEntityType.Opportunity:
          var opportunity = _opportunityService.GetById(request.EntityId, true, true, false); // includeComputed → resolves OrganizationLogoURL

          task.Opportunity = new OpportunityItem
          {
            Id = opportunity.Id,
            Title = opportunity.Title,
            OrganizationName = opportunity.OrganizationName,
            OrganizationLogoId = opportunity.OrganizationLogoId,
            OrganizationLogoStorageType = opportunity.OrganizationLogoStorageType,
            OrganizationLogoKey = opportunity.OrganizationLogoKey,
            OrganizationLogoURL = opportunity.OrganizationLogoURL, // Map; Resolved when retrieving the opportunity (see includeComputed above)
            OrganizationStatus = opportunity.OrganizationStatus,
            VerificationEnabled = opportunity.VerificationEnabled,
            VerificationMethod = opportunity.VerificationMethod,
            Status = opportunity.Status,
            Hidden = opportunity.Hidden,
            DateStart = opportunity.DateStart,
            Type = opportunity.Type,
            Countries = opportunity.Countries
          };

          break;

        default:
          throw new InvalidOperationException($"Entity type of '{request.EntityType}' is not supported");
      }

      return task;
    }

    private async Task<(Program Program, BlobObject ItemAdded)> UpdateImage(Program program, IFormFile? file)
    {
      if (file == null || file.Length == 0)
        throw new ValidationException("File is required");

      var currentLogoId = program.ImageId;

      BlobObject? blobObject = null;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = TransactionScopeHelper.CreateReadCommitted();
          blobObject = await _blobService.Create(FileType.Photos, StorageType.Public, file, null); // public storage; images must remain permanently accessible (e.g., emails, shared links).
          program.ImageId = blobObject.Id;
          program.ImageStorageType = blobObject.StorageType;
          program.ImageKey = blobObject.Key;
          program = await _programRepository.Update(program);
          //ModifiedByUserId: set by caller

          if (currentLogoId.HasValue)
            await _blobService.Archive(currentLogoId.Value, blobObject); //preserve / archive images; they may still appear in sent emails or other public communications

          scope.Complete();
        });
      }
      catch
      {
        if (blobObject != null)
          await _blobService.Delete(blobObject);
        throw;
      }

      if (blobObject == null)
        throw new InvalidOperationException("Blob object expected");

      program = ParseBlobObjectURL(program);

      return (program, blobObject);
    }

    private async Task<(Program Program, bool Updated)> SetAsDefault(Program program)
    {
      var updated = false;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();

        var currentDefault = GetDefaultOrNull(false, false);
        if (currentDefault?.Id == program.Id) // avoid TOCTOU
        {
          scope.Complete();
          return;
        }

        // default must be world-wide: implicit (null) or explicit (contains worldwide)
        var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
        if (!ProgramCountryPolicy.DefaultProgramIsWorldwide(countryIdWorldwide, program.Countries))
          throw new ValidationException("A default referral programme must be available world-wide");

        if (program.Hidden == true)
          throw new ValidationException("A hidden referral programme cannot be made default");

        if (currentDefault != null)
        {
          currentDefault.IsDefault = false;
          currentDefault = await _programRepository.Update(currentDefault);
        }

        program.IsDefault = true;
        program = await _programRepository.Update(program);
        //ModifiedByUserId: set by caller

        scope.Complete();

        updated = true;
      });

      return (program, updated);
    }
    #endregion
  }
}
