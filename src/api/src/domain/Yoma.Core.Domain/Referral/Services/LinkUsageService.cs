using FluentValidation;
using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkUsageService : ILinkUsageService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IProgramService _programService;
    private readonly ILinkUsageStatusService _linkUsageStatusService;
    private readonly IUserService _userService;
    private readonly IMyOpportunityService _myOpportunityService;

    private readonly ReferralLinkUsageSearchFilterValidator _referralLinkUsageSearchFilterValidator;

    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;
    #endregion

    #region Constrcutor
    public LinkUsageService(
      IHttpContextAccessor httpContextAccessor,

      IProgramService programService,
      ILinkUsageStatusService linkUsageStatusService,
      IUserService userService,
      IMyOpportunityService myOpportunityService,

      ReferralLinkUsageSearchFilterValidator referralLinkUsageSearchFilterValidator,

      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository)
    {
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _myOpportunityService = myOpportunityService ?? throw new ArgumentNullException(nameof(myOpportunityService));

      _referralLinkUsageSearchFilterValidator = referralLinkUsageSearchFilterValidator ?? throw new ArgumentNullException(nameof(referralLinkUsageSearchFilterValidator));

      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
    }
    #endregion

    #region Public Members
    public ReferralLinkUsageInfo GetUsageById(Guid id, bool includeComputed, bool ensureOwnership, bool allowAdminOverride)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));

      var result = _linkUsageRepository.Query().SingleOrDefault(x => x.Id == id)
        ?? throw new EntityNotFoundException($"Referral link usage with Id '{id}' does not exist");

      if (!ensureOwnership) return ToInfo(result);

      if (allowAdminOverride && _httpContextAccessor.HttpContext!.User.IsInRole("Admin")) return ToInfo(result);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      if (result.UserId != user.Id //as referee
        || result.UserIdReferrer != user.Id) //as referrer
        throw new SecurityException("Unauthorized");

      return ToInfo(result);
    }

    public ReferralLinkUsageInfo GetByProgramIdAsReferee(Guid programId, bool includeComputed)
    {
      if (programId == Guid.Empty)
        throw new ArgumentNullException(nameof(programId));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var usage = _linkUsageRepository.Query()
        .SingleOrDefault(x => x.ProgramId == programId && x.UserId == user.Id);

      var results = _linkUsageRepository.Query().Where(x => x.ProgramId == programId && x.UserId == user.Id).ToList();

      if (results.Count > 1)
        throw new DataInconsistencyException($"Multiple referral link usages found for program '{programId}' for the current user: Link id's '{string.Join(", ", results.Select(x => x.LinkId))}'");

      if (results.Count == 0)
        throw new EntityNotFoundException($"Referral link usage for program '{programId}' and the current user does not exist");

      return ToInfo(results.Single());
    }

    public ReferralLinkUsageSearchResults SearchAsReferee(ReferralLinkUsageSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var results = Search(new ReferralLinkUsageSearchFilterAdmin
      {
        LinkId = filter.LinkId,
        ProgramId = filter.ProgramId,
        Statuses = filter.Statuses,
        DateStart = filter.DateStart,
        DateEnd = filter.DateEnd,
        UserIdReferee = user.Id,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      });

      return results;
    }

    public ReferralLinkUsageSearchResults SearchAsReferrer(ReferralLinkUsageSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var results = Search(new ReferralLinkUsageSearchFilterAdmin
      {
        LinkId = filter.LinkId,
        ProgramId = filter.ProgramId,
        Statuses = filter.Statuses,
        DateStart = filter.DateStart,
        DateEnd = filter.DateEnd,
        UserIdReferrer = user.Id,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      });

      return results;
    }
    public ReferralLinkUsageSearchResults Search(ReferralLinkUsageSearchFilterAdmin filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _referralLinkUsageSearchFilterValidator.ValidateAndThrow(filter);

      var query = _linkUsageRepository.Query();

      //linkId
      if (filter.LinkId.HasValue)
        query = query.Where(x => x.LinkId == filter.LinkId.Value);

      //programId
      if (filter.ProgramId.HasValue)
        query = query.Where(x => x.ProgramId == filter.ProgramId.Value);

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = [.. filter.Statuses.Distinct()];
        var statusIds = filter.Statuses.Select(o => _linkUsageStatusService.GetByName(o.ToString()).Id).ToList();
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

      //userIdReferee
      if (filter.UserIdReferee.HasValue)
        query = query.Where(x => x.UserId == filter.UserIdReferee.Value);

      //userIdReferrer
      if (filter.UserIdReferrer.HasValue)
        query = query.Where(x => x.UserIdReferrer == filter.UserIdReferrer.Value);

      query = query.OrderByDescending(o => o.DateModified)
        .ThenBy(o => o.LinkName)
        .ThenBy(o => o.ProgramName)
        .ThenBy(o => o.UserDisplayName)
        .ThenBy(o => o.Id);

      var results = new ReferralLinkUsageSearchResults();

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];

      return results;
    }

    public Task ClaimAsReferee(Guid linkId)
    {
      throw new NotImplementedException();
    }
    #endregion

    #region Private Members
    private ReferralLinkUsageInfo ToInfo(ReferralLinkUsage item)
    {
      var result = new ReferralLinkUsageInfo
      {
        Id = item.Id,
        ProgramId = item.ProgramId,
        ProgramName = item.ProgramName,
        LinkId = item.LinkId,
        LinkName = item.LinkName,
        UserIdReferrer = item.UserIdReferrer,
        UserDisplayNameReferrer = item.UserDisplayNameReferrer!,
        UserEmailReferrer = item.UserEmailReferrer,
        UserPhoneNumberReferrer = item.UserPhoneNumberReferrer,
        UserId = item.UserId,
        UserDisplayName = item.UserDisplayName!,
        UserEmail = item.UserEmail,
        UserPhoneNumber = item.UserPhoneNumber,
        StatusId = item.StatusId,
        Status = item.Status,
        DateClaimed = item.DateClaimed,
        DateCompleted = item.DateCompleted,
        DateExpired = item.DateExpired,
        ProofOfPersonhoodMethod = ProofOfPersonhoodMethod.None
      };

      if (item.UserPhoneNumberConfirmed == true) result.ProofOfPersonhoodMethod |= ProofOfPersonhoodMethod.OTP;
      if (_userService.HasSocialIdentityProviders(item.UserId)) result.ProofOfPersonhoodMethod |= ProofOfPersonhoodMethod.SocialLogin;
      result.ProofOfPersonhoodCompleted = result.ProofOfPersonhoodMethod != ProofOfPersonhoodMethod.None;

      var program = _programService.GetById(item.ProgramId, true, false);
      if (program.PathwayRequired && program.Pathway != null)
        throw new DataInconsistencyException("Pathway required but does not exist");

      if (program.Pathway == null)
      {
        result.PercentComplete = result.ProofOfPersonhoodCompleted == true ? 100 : 0;
        return result;
      }

      result.PercentComplete = result.ProofOfPersonhoodCompleted == true ? 50 : 0;

      // NOTE:
      // Pathway StepsTotal, TasksTotal, Completed and PercentComplete are computed inline via property getters.
      // They are not stored values — each is dynamically calculated based on the current Steps/Tasks state.
      result.Pathway = new ProgramPathwayProgress
      {
        Id = program.Pathway.Id,
        Name = program.Pathway.Name,
        Rule = program.Pathway.Rule,
        OrderMode = program.Pathway.OrderMode,
        Steps =
        [
           .. (program.Pathway.Steps ?? []).Select(s => new ProgramPathwayStepProgress
          {
            Id = s.Id,
            Name = s.Name,
            Rule = s.Rule,
            OrderMode = s.OrderMode,  
            Order = s.Order,
            OrderDisplay = s.OrderDisplay,
            Tasks =
            [
              .. (s.Tasks ?? []).Select(t =>
              {
                var task = new ProgramPathwayTaskProgress
                {
                  Id = t.Id,
                  EntityType = t.EntityType,
                  Opportunity = t.Opportunity,
                  Order = t.Order,
                  OrderDisplay = t.OrderDisplay 
                };

                switch (t.EntityType)
                {
                  case PathwayTaskEntityType.Opportunity:
                    if (t.Opportunity == null)
                      throw new DataInconsistencyException("Pathway task entity type is 'Opportunity' but no opportunity is assigned");

                    var verify = _myOpportunityService.GetVerificationStatus(t.Opportunity.Id, result.UserId);
                    if (verify.Status == VerificationStatus.Completed)
                    {
                      task.Completed = true;
                      task.DateCompleted = verify.DateCompleted;
                    }
                    break;
           
                  default:
                    throw new InvalidOperationException($"Unsupported pathway task entity type: {t.EntityType}");
                }

                return task;
              })
            ]
          })
        ]
      };

      result.PercentComplete += result.Pathway.PercentComplete * 0.5m;

      return result;
    }
    #endregion
  }
}
