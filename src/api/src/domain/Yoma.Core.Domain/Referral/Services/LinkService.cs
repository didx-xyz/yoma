using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Extensions;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;
using Yoma.Core.Domain.ShortLinkProvider;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkService : ILinkService
  {
    #region Class Variables
    private readonly ILogger<LinkService> _logger;
    private readonly AppSettings _appSettings;


    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IShortLinkProviderClient _shortLinkProviderClient;

    private readonly IUserService _userService;
    private readonly IProgramInfoService _programInfoService;
    private readonly ILinkStatusService _linkStatusService;
    private readonly ILinkUsageStatusService _linkUsageStatusService;

    private readonly ReferralLinkSearchFilterValidator _referralLinkSearchFilterValidator;
    private readonly ReferralLinkRequestCreateValidator _referralLinkRequestCreateValidator;
    private readonly ReferralLinkRequestUpdateValidator _referralLinkRequestUpdateValidator;

    private readonly IRepositoryBatchedValueContainsWithNavigation<ReferralLink> _linkRepository;

    private static readonly ReferralLinkStatus[] Statuses_Updatable = [ReferralLinkStatus.Active];
    internal static readonly ReferralLinkStatus[] Statuses_Cancellable = [ReferralLinkStatus.Active];
    internal static readonly ReferralLinkStatus[] Statuses_Expirable = [ReferralLinkStatus.Active];
    internal static readonly ReferralLinkStatus[] Statuses_LimitReached = [ReferralLinkStatus.Active];
    #endregion

    #region Constructor
    public LinkService(
      ILogger<LinkService> logger,
      IOptions<AppSettings> appSettings,

      IHttpContextAccessor httpContextAccessor,
      IShortLinkProviderClientFactory shortLinkProviderClientFactory,

      IUserService userService,
      IProgramInfoService programInfoService,
      ILinkStatusService linkStatusService,
      ILinkUsageStatusService linkUsageStatusService,

      ReferralLinkSearchFilterValidator referralLinkSearchFilterValidator,
      ReferralLinkRequestCreateValidator referralLinkRequestCreateValidator,
      ReferralLinkRequestUpdateValidator referralLinkRequestUpdateValidator,

      IRepositoryBatchedValueContainsWithNavigation<ReferralLink> linkRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));

      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _shortLinkProviderClient = shortLinkProviderClientFactory.CreateClient() ?? throw new ArgumentNullException(nameof(shortLinkProviderClientFactory));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _programInfoService = programInfoService ?? throw new ArgumentNullException(nameof(programInfoService));
      _linkStatusService = linkStatusService ?? throw new ArgumentNullException(nameof(linkStatusService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));

      _referralLinkSearchFilterValidator = referralLinkSearchFilterValidator ?? throw new ArgumentNullException(nameof(referralLinkSearchFilterValidator));
      _referralLinkRequestCreateValidator = referralLinkRequestCreateValidator ?? throw new ArgumentNullException(nameof(referralLinkRequestCreateValidator));
      _referralLinkRequestUpdateValidator = referralLinkRequestUpdateValidator ?? throw new ArgumentNullException(nameof(referralLinkRequestUpdateValidator));

      _linkRepository = linkRepository ?? throw new ArgumentNullException(nameof(linkRepository));
    }
    #endregion

    #region Public Members
    public ReferralLink GetById(Guid id, bool includeChildItems, bool ensureOwnership, bool allowAdminOverride, bool? includeQRCode)
    {
      var result = GetByIdOrNull(id, includeChildItems, ensureOwnership, allowAdminOverride, includeQRCode)
        ?? throw new EntityNotFoundException($"{nameof(ReferralLink)} with id '{id}' does not exist");

      return result;
    }

    public ReferralLink? GetByIdOrNull(Guid id, bool includeChildItems, bool ensureOwnership, bool allowAdminOverride, bool? includeQRCode)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _linkRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      if (includeQRCode == true) result.QRCodeBase64 = QRCodeHelper.GenerateQRCodeBase64(result.URL);
      SetUsageAggregates(result);

      if (!ensureOwnership) return result;

      if (allowAdminOverride && HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) return result;

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      if (result.UserId != user.Id) throw new SecurityException("Unauthorized");

      return result;
    }

    public ReferralLink? GetByNameOrNull(Guid userId, Guid programId, string name, bool includeChildItems, bool? includeQRCode)
    {
      if (userId == Guid.Empty) throw new ArgumentNullException(nameof(userId));

      if (string.IsNullOrWhiteSpace(name)) throw new ArgumentNullException(nameof(name));
      name = name.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var result = _linkRepository.Query(includeChildItems).SingleOrDefault(o => o.UserId == userId && o.ProgramId == programId && o.Name.ToLower() == name.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (result == null) return null;

      if (includeQRCode == true) result.QRCodeBase64 = QRCodeHelper.GenerateQRCodeBase64(result.URL);
      SetUsageAggregates(result);

      return result;
    }

    public ReferralLinkSearchResults Search(ReferralLinkSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var filterAdmin = new ReferralLinkSearchFilterAdmin
      {
        UserId = user.Id,
        ProgramId = filter.ProgramId,
        ValueContains = filter.ValueContains,
        Statuses = filter.Statuses,
        DateStart = filter.DateStart,
        DateEnd = filter.DateEnd,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      };

      return Search(filterAdmin);
    }

    public ReferralLinkSearchResults Search(ReferralLinkSearchFilterAdmin filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _referralLinkSearchFilterValidator.ValidateAndThrow(filter);

      var query = _linkRepository.Query(true);

      //userId
      if (filter.UserId.HasValue)
        query = query.Where(o => o.UserId == filter.UserId.Value);

      //programId
      if (filter.ProgramId.HasValue)
        query = query.Where(o => o.ProgramId == filter.ProgramId.Value);

      //valueContains
      if (!string.IsNullOrEmpty(filter.ValueContains))
      {
        filter.ValueContains = filter.ValueContains.Trim();
        query = _linkRepository.Contains(query, filter.ValueContains);
      }

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = [.. filter.Statuses.Distinct()];
        var statusIds = filter.Statuses.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      //date range
      if (filter.DateStart.HasValue)
      {
        filter.DateStart = filter.DateStart.Value.RemoveTime();
        query = query.Where(o => o.DateCreated >= filter.DateStart.Value);
      }

      if (filter.DateEnd.HasValue)
      {
        filter.DateEnd = filter.DateEnd.Value.ToEndOfDay();
        query = query.Where(o => o.DateCreated <= filter.DateEnd.Value);
      }

      var results = new ReferralLinkSearchResults();

      if (filter.TotalCountOnly)
      {
        results.TotalCount = query.Count();
        return results;
      }

      query = query.OrderByDescending(o => o.DateModified)
        .ThenBy(o => o.Name)
        .ThenBy(o => o.ProgramName)
        .ThenBy(o => o.UserDisplayName)
        .ThenBy(o => o.Id);

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];
      results.Items.ForEach(SetUsageAggregates);

      return results;
    }

    public async Task<ReferralLink> Create(ReferralLinkRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _referralLinkRequestCreateValidator.ValidateAndThrowAsync(request);

      var program = _programInfoService.GetById(request.ProgramId, false, false);

      if (program.Status != ProgramStatus.Active || program.DateStart > DateTimeOffset.UtcNow)
        throw new ValidationException($"Referral program '{program.Name}' is not active or has not started");

      if (program.DateEnd.HasValue && program.DateEnd <= DateTimeOffset.UtcNow) // Fallback guard in case program expiration job has’t run yet
        throw new ValidationException($"Referral program '{program.Name}' expired on '{program.DateEnd:yyyy-MM-dd}'");

      if (program.CompletionLimit.HasValue && (program.CompletionBalance ?? 0) <= 0)
        throw new ValidationException($"Referral program '{program.Name}' has reached its completion limit");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var statusLinkActive = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString());

      var existingLink = _linkRepository.Query().FirstOrDefault(o => o.ProgramId == program.Id && o.UserId == user.Id && o.StatusId == statusLinkActive.Id);

      if (!program.MultipleLinksAllowed && existingLink != null)
        throw new ValidationException($"Multiple active referral links are not allowed for program '{program.Name}'");

      var existingByName = GetByNameOrNull(user.Id, program.Id, request.Name, false, false);
      if (existingByName != null)
        throw new ValidationException($"A referral link with the name '{request.Name}' already exists for the current user");

      var result = new ReferralLink
      {
        Id = Guid.NewGuid(),
        Name = request.Name,
        Description = request.Description,
        ProgramId = program.Id,
        ProgramName = program.Name,
        ProgramDescription = program.Description,
        ProgramCompletionLimitReferee = program.CompletionLimitReferee,
        UserId = user.Id,
        UserDisplayName = user.DisplayName ?? user.Username,
        Username = user.Username,
        UserEmail = user.Email,
        UserEmailConfirmed = user.EmailConfirmed,
        UserPhoneNumber = user.PhoneNumber,
        UserPhoneNumberConfirmed = user.PhoneNumberConfirmed,
        Blocked = false,
        StatusId = statusLinkActive.Id,
        Status = ReferralLinkStatus.Active
      };

      result.URL = result.ClaimURL(_appSettings.AppBaseURL);
      result = await GenerateShortLink(result);

      result = await _linkRepository.Create(result);

      if (request.IncludeQRCode == true) result.QRCodeBase64 = QRCodeHelper.GenerateQRCodeBase64(result.URL);

      return result;
    }

    public async Task<ReferralLink> Update(ReferralLinkRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _referralLinkRequestUpdateValidator.ValidateAndThrowAsync(request);

      //link must belong to the current user
      var result = GetById(request.Id, true, true, false, request.IncludeQRCode);

      if (!Statuses_Updatable.Contains(result.Status))
        throw new ValidationException($"Referral link can no longer be updated (current status '{result.Status.ToDescription()}'). Required state '{Statuses_Updatable.JoinNames()}'");

      var existingByName = GetByNameOrNull(result.UserId, result.ProgramId, request.Name, false, false);
      if (existingByName != null && existingByName.Id != result.Id)
        throw new ValidationException($"A referral link with the name '{request.Name}' already exists for the current user");

      result.Name = request.Name;
      result.Description = request.Description;

      result = await _linkRepository.Update(result);

      if (request.IncludeQRCode == true) result.QRCodeBase64 = QRCodeHelper.GenerateQRCodeBase64(result.URL);
      SetUsageAggregates(result);

      return result;
    }

    public async Task<ReferralLink> Cancel(Guid id)
    {
      //ensures the link belongs to the current user unless the caller has admin privileges
      var result = GetById(id, true, true, true, false);

      if (result.Status == ReferralLinkStatus.Cancelled) return result;

      if (!Statuses_Cancellable.Contains(result.Status))
        throw new ValidationException($"Referral link cannot be cancelled (current status '{result.Status.ToDescription()}'). Required state '{Statuses_Cancellable.JoinNames()}'");

      var status = _linkStatusService.GetByName(ReferralLinkStatus.Cancelled.ToString());
      result.StatusId = status.Id;
      result.Status = ReferralLinkStatus.Cancelled;

      await _linkRepository.Update(result);

      return result;
    }

    // NOTE:
    // Assumes an ambient TransactionScope and (optionally) execution strategy
    // at the call site (e.g. LinkUsageService.ProcessProgressByUserId).
    // This method relies on row-level locking via LockMode.Wait to ensure
    // atomic updates of completion counters and status transitions.
    public async Task<ReferralLink> ProcessCompletion(Program program, Guid linkId, decimal? rewardAmount)
    {
      ArgumentNullException.ThrowIfNull(program, nameof(program));

      if (linkId == Guid.Empty)
        throw new ArgumentNullException(nameof(linkId));

      var statusLimitReached = _linkStatusService.GetByName(ReferralLinkStatus.LimitReached.ToString());

      var link = _linkRepository.Query(Core.LockMode.Wait).SingleOrDefault(o => o.Id == linkId)
        ?? throw new EntityNotFoundException($"Referral link with id '{linkId}' does not exist");

      // Increment total (always)
      link.CompletionTotal = (link.CompletionTotal ?? 0) + 1;

      // Only init (if needed) and add reward if any reward
      if (rewardAmount.HasValue && rewardAmount.Value > 0m)
        link.ZltoRewardCumulative = (link.ZltoRewardCumulative ?? 0m) + rewardAmount.Value;

      // Only flip to LimitReached if:
      //  • cap is configured and total >= cap (per-referrer), OR program already LimitReached (global cap)
      //  • link currently Active
      var perRefCapHit = program.CompletionLimitReferee.HasValue &&
                         link.CompletionTotal >= program.CompletionLimitReferee.Value;

      var programCapHit = program.Status == ProgramStatus.LimitReached;

      if (link.Status == ReferralLinkStatus.Active && (perRefCapHit || programCapHit))
      {
        if (perRefCapHit && programCapHit)
        {
          _logger.LogInformation(
            "Referral link {LinkId}: per-referrer cap reached (total {Total} >= limit {Limit}) AND program {ProgramId} LIMIT_REACHED — flipping link to LIMIT_REACHED",
            link.Id, link.CompletionTotal, program.CompletionLimitReferee, program.Id);
        }
        else if (perRefCapHit)
        {
          _logger.LogInformation(
            "Referral link {LinkId}: per-referrer cap reached (total {Total} >= limit {Limit}) — flipping to LIMIT_REACHED",
            link.Id, link.CompletionTotal, program.CompletionLimitReferee);
        }
        else // programCapHit
        {
          _logger.LogInformation(
            "Referral link {LinkId}: program {ProgramId} LIMIT_REACHED (global cap) — flipping link to LIMIT_REACHED",
            link.Id, program.Id);
        }

        link.Status = ReferralLinkStatus.LimitReached;
        link.StatusId = statusLimitReached.Id;
      }
      else
      {
        _logger.LogDebug(
          "Referral link {LinkId}: totals updated (total {Total}, rewardΔ {RewardDelta}); status remains {Status} (per-ref cap {Cap}, programLimitReached={ProgCap}, active={IsActive})",
          link.Id,
          link.CompletionTotal,
          rewardAmount ?? 0m,
          link.Status,
          program.CompletionLimitReferee?.ToString() ?? "null",
          programCapHit,
          link.Status == ReferralLinkStatus.Active);
      }

      link = await _linkRepository.Update(link);

      return link;
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

    private void SetUsageAggregates(ReferralLink item)
    {
      if (item.UsageAggregate == null) return;

      var statusPending = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString());
      var statusExpired = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString());

      item.CompletionTotal ??= 0;
      item.PendingTotal = item.UsageAggregate.UsageCountsByStatus.SingleOrDefault(o => o.StatusId == statusPending.Id)?.Count ?? 0;
      item.ExpiredTotal = item.UsageAggregate.UsageCountsByStatus.SingleOrDefault(o => o.StatusId == statusExpired.Id)?.Count ?? 0;
      item.UsageTotal = item.CompletionTotal + item.PendingTotal + item.ExpiredTotal;

      item.ZltoRewardReferrerTotal = item.UsageAggregate.ZltoRewardReferrerTotal;
      item.ZltoRewardRefereeTotal = item.UsageAggregate.ZltoRewardRefereeTotal;
    }
    #endregion
  }
}
