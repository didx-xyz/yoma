using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Linq.Expressions;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.MyOpportunity.Helpers;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.MyOpportunity.Services
{
    public class MyOpportunityService : IMyOpportunityService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IOpportunityService _opportunityService;
        private readonly IMyOpportunityActionService _myOpportunityActionService;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IOpportunityStatusService _opportunityStatusService;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IBlobService _blobService;
        private readonly MyOpportunitySearchFilterValidator _myOpportunitySearchFilterValidator;
        private readonly MyOpportunityRequestValidatorVerify _myOpportunityRequestValidatorVerify;
        private readonly MyOpportunityRequestValidatorVerifyFinalize _myOpportunityRequestValidatorVerifyFinalize;
        private readonly IRepository<Models.MyOpportunity> _myOpportunityRepository;
        #endregion

        #region Constructor
        public MyOpportunityService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IOpportunityService opportunityService,
            IMyOpportunityActionService myOpportunityActionService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IOpportunityStatusService opportunityStatusService,
            IOrganizationStatusService organizationStatusService,
            MyOpportunitySearchFilterValidator myOpportunitySearchFilterValidator,
            MyOpportunityRequestValidatorVerify myOpportunityRequestValidatorVerify,
            MyOpportunityRequestValidatorVerifyFinalize myOpportunityRequestValidatorVerifyFinalize,
            IBlobService blobService,

            IRepository<Models.MyOpportunity> myOpportunityRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _opportunityService = opportunityService;
            _myOpportunityActionService = myOpportunityActionService;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _myOpportunityRequestValidatorVerify = myOpportunityRequestValidatorVerify;
            _myOpportunityRequestValidatorVerifyFinalize = myOpportunityRequestValidatorVerifyFinalize;
            _opportunityStatusService = opportunityStatusService;
            _organizationStatusService = organizationStatusService;
            _blobService = blobService;
            _myOpportunitySearchFilterValidator = myOpportunitySearchFilterValidator;
            _myOpportunityRepository = myOpportunityRepository;
        }
        #endregion

        #region Public Members
        public MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _myOpportunitySearchFilterValidator.ValidateAndThrow(filter);

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var actionId = _myOpportunityActionService.GetByName(filter.Action.ToString()).Id;
            var opportunityStatusActiveId = _opportunityStatusService.GetByName(Opportunity.Status.Active.ToString()).Id;
            var opportunityStatusExpiredId = _opportunityStatusService.GetByName(Opportunity.Status.Expired.ToString()).Id;
            var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;

            var query = _myOpportunityRepository.Query();

            // action
            query = query.Where(o => o.ActionId == actionId);

            // authenticated user
            query = query.Where(o => o.UserId == user.Id);

            switch (filter.Action)
            {
                case Action.Saved:
                case Action.Viewed:
                    // published: relating to active opportunities (irrespective of started) that relates to active organizations
                    query = query.Where(o => o.OpportunityStatusId == opportunityStatusActiveId);
                    query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);
                    query.OrderByDescending(o => o.DateModified);
                    break;

                case Action.Verification:
                    if (!filter.VerificationStatus.HasValue)
                        throw new ArgumentNullException(nameof(filter), "Verification status required");

                    var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(filter.VerificationStatus.Value.ToString()).Id;
                    query = query.Where(o => o.VerificationStatusId == verificationStatusId);

                    switch (filter.VerificationStatus.Value)
                    {
                        case VerificationStatus.Pending:
                            // items that can be completed, thus started opportunities (active) or expired opportunities that relates to active organizations
                            query = query.Where(o => (o.OpportunityStatusId == opportunityStatusActiveId && o.DateStart <= DateTimeOffset.Now)
                                || o.OpportunityStatusId == opportunityStatusExpiredId);
                            query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);
                            query.OrderByDescending(o => o.DateModified);
                            break;

                        case VerificationStatus.Completed:
                            // all, irrespective of related opportunity and organization status
                            query.OrderByDescending(o => o.DateCompleted);
                            break;

                        case VerificationStatus.Rejected:
                            // all, irrespective of related opportunity and organization status
                            query.OrderByDescending(o => o.DateModified);
                            break;

                        default:
                            throw new InvalidOperationException($"Unknown / unsupported '{nameof(filter.VerificationStatus)}' of '{filter.VerificationStatus.Value}'");
                    }
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

            result.Items = query.ToList().Select(o => o.ToInfo()).ToList();
            result.Items.ForEach(o => o.CertificateURL = GetBlobObjectURL(o.CertificateId));
            return result;
        }

        public async Task PerformActionViewed(Guid opportunityId)
        {
            //published opportunities (irrespective of started)
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (!opportunity.Published)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be actioned (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var actionViewedId = _myOpportunityActionService.GetByName(Action.Viewed.ToString()).Id;

            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionViewedId);
            if (item == null)
            {
                item = new Models.MyOpportunity
                {
                    UserId = user.Id,
                    OpportunityId = opportunity.Id,
                    ActionId = actionViewedId
                };
                await _myOpportunityRepository.Create(item);
            }
            else
                await _myOpportunityRepository.Update(item); //update DateModified
        }

        public async Task PerformActionSaved(Guid opportunityId)
        {
            //published opportunities (irrespective of started)
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (!opportunity.Published)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be actioned (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;

            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);
            if (item == null)
            {
                item = new Models.MyOpportunity
                {
                    UserId = user.Id,
                    OpportunityId = opportunity.Id,
                    ActionId = actionSavedId
                };
                await _myOpportunityRepository.Create(item);
            }
            else
                await _myOpportunityRepository.Update(item); //update DateModified
        }

        public async Task PerformActionSavedRemove(Guid opportunityId)
        {
            //published opportunities (irrespective of started)
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (!opportunity.Published)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be actioned (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;
            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);

            if (item == null) return; //not saved

            await _myOpportunityRepository.Delete(item);
        }

        public async Task PerformActionSendForVerification(Guid opportunityId, MyOpportunityRequestVerify request)
        {
            //published and started opportunities
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (!opportunity.Published || opportunity.DateStart > DateTimeOffset.Now)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be actioned (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            if (!opportunity.VerificationSupported)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be completed / does not support verification");

            if (request.DateStart.HasValue && request.DateStart.Value < opportunity.DateStart)
                throw new ValidationException($"Start date can not be earlier than the opportunity stated date of '{opportunity.DateStart}'");

            if (request.DateEnd.HasValue && opportunity.DateEnd.HasValue && request.DateEnd.Value > opportunity.DateEnd.Value)
                throw new ValidationException($"End date can not be later than the opportunity end date of '{opportunity.DateEnd}'");

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
            var verificationStatusPendingId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Pending.ToString()).Id;

            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId);
            var isNew = item == null;

            if (item == null)
            {
                item = new Models.MyOpportunity
                {
                    UserId = user.Id,
                    OpportunityId = opportunity.Id,
                    ActionId = actionVerificationId,
                };
            }
            else
            {
                switch (item.VerificationStatus)
                {
                    case null:
                        throw new DataInconsistencyException($"{nameof(item.VerificationStatus)} expected with action '{Action.Verification}'");

                    case VerificationStatus.Pending:
                    case VerificationStatus.Completed:
                        throw new ValidationException($"Verification is {item.VerificationStatus?.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

                    case VerificationStatus.Rejected: //can be re-send for verification
                        break;

                    default:
                        throw new InvalidOperationException($"Unknown / unsupported '{nameof(item.VerificationStatus)}' of '{item.VerificationStatus.Value}'");
                }
            }

            item.VerificationStatusId = verificationStatusPendingId;
            item.DateStart = request.DateStart.RemoveTime();
            item.DateEnd = request.DateEnd.ToEndOfDay();

            var currentCertificate = item.CertificateId.HasValue ? new { Id = item.CertificateId.Value, File = await _blobService.Download(item.CertificateId.Value) } : null;

            BlobObject? blobObject = null;
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
                blobObject = await _blobService.Create(request.Certificate, FileType.Photos);
                item.CertificateId = blobObject.Id;

                if (isNew)
                    await _myOpportunityRepository.Create(item);
                else
                    await _myOpportunityRepository.Update(item);

                if (currentCertificate != null)
                    await _blobService.Delete(currentCertificate.Id);

                scope.Complete();

                //TODO: Send email (youth and OP)
            }
            catch
            {
                if (blobObject != null)
                    await _blobService.Delete(blobObject.Key);

                if (currentCertificate != null)
                    await _blobService.Create(currentCertificate.Id, currentCertificate.File, FileType.Photos);

                throw;
            }
        }

        //supported statuses: Rejected or Completed
        public async Task FinalizeVerification(Guid opportunityId, MyOpportunityRequestVerifyFinalize request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var user = _userService.GetById(request.UserId, false);

            //can complete, provided opportunity is active (and started) or expired (actioned prior to expiration)
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            var canFinalize = opportunity.Status == Opportunity.Status.Expired;
            if (!canFinalize) canFinalize = opportunity.Published && opportunity.DateStart <= DateTimeOffset.Now;
            if (!canFinalize)
                throw new ValidationException($"Verification for opportunity '{opportunity.Title}' can no longer be finalized (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
                ?? throw new ValidationException($"Opportunity '{opportunity.Title}' has not been sent for verification for user '{user.Email}'");

            if (item.VerificationStatus != VerificationStatus.Pending)
                throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

            if (item.VerificationStatus == request.Status) return;

            var statusId = _myOpportunityVerificationStatusService.GetByName(request.Status.ToString()).Id;

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            item.VerificationStatusId = statusId;
            item.VerificationComment = request.Comment;

            switch (request.Status)
            {
                case VerificationStatus.Rejected:
                    break;

                case VerificationStatus.Completed:
                    var dateCompleted = DateTimeOffset.Now;

                    if (item.DateEnd.HasValue && item.DateEnd.Value > dateCompleted)
                        throw new ValidationException($"Verification can not be completed as the end date for 'my' opportunity '{opportunity.Title}' has not been reached (end date '{item.DateEnd}')");

                    var (zltoReward, yomaReward) = await _opportunityService.AllocateRewards(opportunity.Id, true);
                    item.ZltoReward = zltoReward;
                    item.YomaReward = yomaReward;
                    item.DateCompleted = DateTimeOffset.Now;

                    var skillIds = opportunity.Skills?.Select(o => o.Id).ToList();
                    if (skillIds != null && skillIds.Any())
                        await _userService.AssignSkills(user.Id, skillIds);
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(request), $"{nameof(request.Status)} of '{request.Status}' not supported");
            }

            await _myOpportunityRepository.Update(item);

            //TODO: Send email (youth)
        }
        #endregion

        #region Private Members
        private string? GetBlobObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return _blobService.GetURL(id.Value);
        }
        #endregion
    }
}
