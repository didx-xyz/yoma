using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
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
        private readonly IEmailURLFactory _emailURLFactory;
        private readonly IEmailProviderClient _emailProviderClient;
        private readonly MyOpportunitySearchFilterValidator _myOpportunitySearchFilterValidator;
        private readonly MyOpportunityRequestValidatorVerify _myOpportunityRequestValidatorVerify;
        private readonly MyOpportunityRequestValidatorVerifyFinalize _myOpportunityRequestValidatorVerifyFinalize;
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
            IEmailURLFactory emailURLFactory,
            IEmailProviderClientFactory emailProviderClientFactory,
            MyOpportunitySearchFilterValidator myOpportunitySearchFilterValidator,
            MyOpportunityRequestValidatorVerify myOpportunityRequestValidatorVerify,
            MyOpportunityRequestValidatorVerifyFinalize myOpportunityRequestValidatorVerifyFinalize,
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
            _emailURLFactory = emailURLFactory;
            _emailProviderClient = emailProviderClientFactory.CreateClient();
            _myOpportunitySearchFilterValidator = myOpportunitySearchFilterValidator;
            _myOpportunityRequestValidatorVerify = myOpportunityRequestValidatorVerify;
            _myOpportunityRequestValidatorVerifyFinalize = myOpportunityRequestValidatorVerifyFinalize;
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
                result.UserPhotoURL = GetBlobObjectURL(result.UserPhotoId);
                result.OrganizationLogoURL = GetBlobObjectURL(result.OrganizationLogoId);
                result.Verifications?.ForEach(v => v.FileURL = GetBlobObjectURL(v.FileId));
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

            //organization (explicitly specified)
            if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
            {
                //ensure the organization admin is the admin of the specified organizations
                if (organizations != null && organizations.Any())
                {
                    organizations = organizations.Distinct().ToList();
                    _organizationService.IsAdminsOf(organizations, true);
                }
                else
                    //ensure search only spans authorized organizations
                    organizations = _organizationService.ListAdminsOf(false).Select(o => o.Id).ToList();
            }

            if (organizations != null && organizations.Any())
                query = query.Where(o => organizations.Contains(o.OrganizationId));

            if (verificationStatuses != null && verificationStatuses.Any())
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
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

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
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _myOpportunitySearchFilterValidator.ValidateAndThrow(filter);

            var actionId = _myOpportunityActionService.GetByName(filter.Action.ToString()).Id;
            var opportunityStatusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
            var opportunityStatusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
            var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;

            var query = _myOpportunityRepository.Query(true);

            //organization (explicitly specified)
            if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
            {
                //ensure the organization admin is the admin of the specified organizations
                if (filter.Organizations != null && filter.Organizations.Any())
                {
                    filter.Organizations = filter.Organizations.Distinct().ToList();
                    _organizationService.IsAdminsOf(filter.Organizations, true);
                }
                else
                    //ensure search only spans authorized organizations
                    filter.Organizations = _organizationService.ListAdminsOf(false).Select(o => o.Id).ToList();
            }

            if (filter.Organizations != null && filter.Organizations.Any())
                query = query.Where(o => filter.Organizations.Contains(o.OrganizationId));

            //action (required)
            query = query.Where(o => o.ActionId == actionId);

            //userId (explicitly specified)
            if (filter.UserId.HasValue)
                query = query.Where(o => o.UserId == filter.UserId);

            //opportunity (explicitly specified)
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
                    query = query.OrderByDescending(o => o.DateModified);
                    break;

                case Action.Verification:
                    if (filter.VerificationStatuses == null || !filter.VerificationStatuses.Any())
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
                    query = query.OrderByDescending(o => o.DateModified).ThenByDescending(o => o.DateCompleted);

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
                o.UserPhotoURL = GetBlobObjectURL(o.UserPhotoId);
                o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoId);
                o.Verifications?.ForEach(v => v.FileURL = GetBlobObjectURL(v.FileId));
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
            if (!opportunity.Published)
                throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "cannot be actioned"));

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
            await PerformActionSendForVerificationManual(user, opportunityId, request, overridePending);
        }

        public async Task PerformActionSendForVerificationManual(Guid opportunityId, MyOpportunityRequestVerify request)
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
            await PerformActionSendForVerificationManual(user, opportunityId, request, false);
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

        public async Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalizeBatch request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.Items == null)
                throw new ArgumentNullException(nameof(request), "No items specified");

            await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
            {
                // request validated by FinalizeVerification
                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                foreach (var item in request.Items)
                {
                    await FinalizeVerificationManual(new MyOpportunityRequestVerifyFinalize
                    {
                        OpportunityId = item.OpportunityId,
                        UserId = item.UserId,
                        Status = request.Status,
                        Comment = request.Comment
                    });
                }

                scope.Complete();
            });
        }

        //supported statuses: Rejected or Completed
        public async Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalize request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _myOpportunityRequestValidatorVerifyFinalize.ValidateAndThrowAsync(request);

            var user = _userService.GetById(request.UserId, false, false);

            //can complete, provided opportunity is published (and started) or expired (actioned prior to expiration)
            var opportunity = _opportunityService.GetById(request.OpportunityId, true, true, false);
            var canFinalize = opportunity.Status == Status.Expired;
            if (!canFinalize) canFinalize = opportunity.Published && opportunity.DateStart <= DateTimeOffset.UtcNow;
            if (!canFinalize)
                throw new ValidationException(PerformActionNotPossibleValidationMessage(opportunity, "verification cannot be finalized"));

            var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
            var item = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
                ?? throw new ValidationException($"Opportunity '{opportunity.Title}' has not been sent for verification for user '{user.Email}'");

            if (item.VerificationStatus != VerificationStatus.Pending)
                throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

            if (item.VerificationStatus == request.Status) return;

            var statusId = _myOpportunityVerificationStatusService.GetByName(request.Status.ToString()).Id;

            EmailType? emailType = null;
            await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
            {
                using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

                item.VerificationStatusId = statusId;
                item.CommentVerification = request.Comment;

                switch (request.Status)
                {
                    case VerificationStatus.Rejected:
                        emailType = EmailType.Opportunity_Verification_Rejected;
                        break;

                    case VerificationStatus.Completed:
                        if (item.DateEnd.HasValue && item.DateEnd.Value > DateTimeOffset.UtcNow.ToEndOfDay())
                            throw new ValidationException($"Verification can not be completed as the end date for 'my' opportunity '{opportunity.Title}' has not been reached (end date '{item.DateEnd:yyyy-MM-dd}')");

                        var (zltoReward, yomaReward) = await _opportunityService.AllocateRewards(opportunity.Id, user.Id, true);
                        item.ZltoReward = zltoReward;
                        item.YomaReward = yomaReward;
                        item.DateCompleted = DateTimeOffset.UtcNow;

                        await _userService.AssignSkills(user, opportunity);

                        if (item.OpportunityCredentialIssuanceEnabled)
                        {
                            if (string.IsNullOrEmpty(item.OpportunitySSISchemaName))
                                throw new InvalidOperationException($"Credential Issuance Enabled: Schema name expected for opportunity with id '{item.Id}'");
                            await _ssiCredentialService.ScheduleIssuance(item.OpportunitySSISchemaName, item.Id);
                        }

                        if (zltoReward.HasValue)
                            await _rewardService.ScheduleRewardTransaction(user.Id, Reward.RewardTransactionEntityType.MyOpportunity, item.Id, zltoReward.Value);

                        emailType = EmailType.Opportunity_Verification_Completed;
                        break;

                    default:
                        throw new ArgumentOutOfRangeException(nameof(request), $"{nameof(request.Status)} of '{request.Status}' not supported");
                }

                item = await _myOpportunityRepository.Update(item);

                scope.Complete();
            });

            if (!emailType.HasValue)
                throw new InvalidOperationException($"Email type expected");

            await SendEmail(item, emailType.Value);
        }

        public Dictionary<Guid, int>? ListAggregatedOpportunityByViewed(PaginationFilter filter, bool includeExpired)
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

            if (filter.PaginationEnabled)
                queryGrouped = queryGrouped.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);

            return queryGrouped.ToDictionary(o => o.OpportunityId, o => o.Count);
        }
        #endregion

        #region Private Members
        private void SetParticipantCounts(MyOpportunityInfo result)
        {
            var filter = new MyOpportunitySearchFilterAdmin
            {
                TotalCountOnly = true,
                Opportunity = result.OpportunityId,
                Action = Action.Verification,
                VerificationStatuses = new List<VerificationStatus> { VerificationStatus.Pending }
            };

            var searchResult = Search(filter, false);
            result.OpportunityParticipantCountTotal += searchResult.TotalCount ?? default;
        }

        private string? GetBlobObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return _blobService.GetURL(id.Value);
        }

        private string PerformActionNotPossibleValidationMessage(Opportunity.Models.Opportunity opportunity, string description)
        {
            var reasons = new List<string>();

            if (!opportunity.Published)
                reasons.Add("it has not been published");

            if (opportunity.Status != Status.Active)
                reasons.Add($"its status is '{opportunity.Status}'");

            if (opportunity.DateStart > DateTimeOffset.UtcNow)
                reasons.Add($"it has not yet started (start date: {opportunity.DateStart:yyyy-MM-dd})");

            var reasonText = string.Join(", ", reasons);

            return $"Oportunity '{opportunity.Title}' {description}, because {reasonText}. Please check these conditions and try again";
        }

        private async Task PerformActionSendForVerificationManual(User user, Guid opportunityId, MyOpportunityRequestVerify request, bool overridePending)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

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

            if (opportunity.VerificationTypes == null || !opportunity.VerificationTypes.Any())
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
                        if (overridePending) break;
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

            await PerformActionSendForVerificationManual(request, opportunity, myOpportunity, isNew);

            //used by emailer
            myOpportunity.UserEmail = user.Email;
            myOpportunity.UserDisplayName = user.DisplayName;
            myOpportunity.OpportunityTitle = opportunity.Title;
            myOpportunity.OrganizationId = opportunity.OrganizationId;
            myOpportunity.ZltoReward = opportunity.ZltoReward;
            myOpportunity.YomaReward = opportunity.YomaReward;

            //sent to youth
            await SendEmail(myOpportunity, EmailType.Opportunity_Verification_Pending);

            //sent to organization admins
            await SendEmail(myOpportunity, EmailType.Opportunity_Verification_Pending_Admin);
        }

        private async Task SendEmail(Models.MyOpportunity myOpportunity, EmailType type)
        {
            try
            {
                List<EmailRecipient>? recipients = null;
                switch (type)
                {
                    case EmailType.Opportunity_Verification_Rejected:
                    case EmailType.Opportunity_Verification_Completed:
                    case EmailType.Opportunity_Verification_Pending:
                        recipients = new List<EmailRecipient>
                        {
                            new() { Email = myOpportunity.UserEmail, DisplayName = myOpportunity.UserDisplayName }
                        };
                        break;

                    case EmailType.Opportunity_Verification_Pending_Admin:
                        recipients = _organizationService.ListAdmins(myOpportunity.OrganizationId, false, false)
                            .Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.DisplayName }).ToList();
                        break;

                    default:
                        throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported");
                }

                if (recipients == null || !recipients.Any()) return;

                var data = new EmailOpportunityVerification
                {
                    YoIDURL = _emailURLFactory.OpportunityVerificationYoIDURL(type),
                    VerificationURL = _emailURLFactory.OpportunityVerificationURL(type, myOpportunity.OrganizationId),
                    Opportunities = new List<EmailOpportunityVerificationItem>()
                    {
                        new() {
                            Title = myOpportunity.OpportunityTitle,
                            DateStart = myOpportunity.DateStart,
                            DateEnd = myOpportunity.DateEnd,
                            Comment = myOpportunity.CommentVerification,
                            URL = _emailURLFactory.OpportunityVerificationItemURL(type, myOpportunity.OpportunityId, myOpportunity.OrganizationId),
                            ZltoReward = myOpportunity.ZltoReward,
                            YomaReward = myOpportunity.YomaReward
                        }
                    }
                };

                await _emailProviderClient.Send(type, recipients, data);

                _logger.LogInformation("Successfully send '{emailType}' email", type);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send '{emailType}' email", type);
            }
        }

        private async Task PerformActionSendForVerificationManual(MyOpportunityRequestVerify request, Opportunity.Models.Opportunity opportunity, Models.MyOpportunity myOpportunity, bool isNew)
        {
            var itemsExisting = new List<MyOpportunityVerification>();
            var itemsExistingDeleted = new List<MyOpportunityVerification>();
            var itemsNewBlobs = new List<BlobObject>();
            try
            {
                await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
                {
                    using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

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
                    if (opportunity.VerificationTypes != null)
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
        #endregion
    }
}
