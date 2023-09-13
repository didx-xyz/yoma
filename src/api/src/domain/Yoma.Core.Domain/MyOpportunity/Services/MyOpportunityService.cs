using FluentValidation;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
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
        private readonly IOrganizationService _organizationService;
        private readonly IOpportunityService _opportunityService;
        private readonly IMyOpportunityActionService _myOpportunityActionService;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IOpportunityStatusService _opportunityStatusService;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IBlobService _blobService;
        private readonly MyOpportunitySearchFilterValidator _myOpportunitySearchFilterValidator;
        private readonly MyOpportunityRequestValidatorVerify _myOpportunityRequestValidatorVerify;
        private readonly MyOpportunityRequestValidatorVerifyFinalize _myOpportunityRequestValidatorVerifyFinalize;
        private readonly IRepositoryWithNavigation<Models.MyOpportunity> _myOpportunityRepository;
        private readonly IRepository<MyOpportunityVerification> _myOpportunityVerificationRepository;
        #endregion

        #region Constructor
        public MyOpportunityService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IOrganizationService organizationService,
            IOpportunityService opportunityService,
            IMyOpportunityActionService myOpportunityActionService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IOpportunityStatusService opportunityStatusService,
            IOrganizationStatusService organizationStatusService,
            MyOpportunitySearchFilterValidator myOpportunitySearchFilterValidator,
            MyOpportunityRequestValidatorVerify myOpportunityRequestValidatorVerify,
            MyOpportunityRequestValidatorVerifyFinalize myOpportunityRequestValidatorVerifyFinalize,
            IBlobService blobService,
            IRepositoryWithNavigation<Models.MyOpportunity> myOpportunityRepository,
            IRepository<MyOpportunityVerification> myOpportunityVerificationRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _organizationService = organizationService;
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
            _myOpportunityVerificationRepository = myOpportunityVerificationRepository;
        }
        #endregion

        #region Public Members
        public MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            //filter validated by SearchAdmin

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var filterInternal = new MyOpportunitySearchFilterAdmin
            {
                UserId = user.Id,
                Action = filter.Action,
                VerificationStatus = filter.VerificationStatus,
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
            var opportunityStatusActiveId = _opportunityStatusService.GetByName(Opportunity.Status.Active.ToString()).Id;
            var opportunityStatusExpiredId = _opportunityStatusService.GetByName(Opportunity.Status.Expired.ToString()).Id;
            var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;

            var query = _myOpportunityRepository.Query(true);

            //ensureOrganizationAuthorization (ensure search only spans authorized organizations)
            if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
            {
                var organizationIds = _organizationService.ListAdminsOf().Select(o => o.Id).ToList();
                query = query.Where(o => organizationIds.Contains(o.OrganizationId));
            }

            //action (required)
            query = query.Where(o => o.ActionId == actionId);

            //userId (explicitly specified)
            if (filter.UserId.HasValue)
                query = query.Where(o => o.UserId == filter.UserId);

            //opportunity (explicitly specified)
            if (filter.OpportunityId.HasValue)
                query = query.Where(o => o.OpportunityId == filter.OpportunityId);

            //valueContains (opportunities and users) 
            if (!string.IsNullOrEmpty(filter.ValueContains))
            {
                var predicate = PredicateBuilder.False<Models.MyOpportunity>();

                var matchedOpportunityIds = _opportunityService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                predicate = predicate.Or(o => matchedOpportunityIds.Contains(o.OpportunityId));

                var matchedUserIds = _userService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
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
                            //items that can be completed, thus started opportunities (active) or expired opportunities that relates to active organizations
                            query = query.Where(o => (o.OpportunityStatusId == opportunityStatusActiveId && o.DateStart <= DateTimeOffset.Now)
                                || o.OpportunityStatusId == opportunityStatusExpiredId);
                            query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);
                            query.OrderByDescending(o => o.DateModified);
                            break;

                        case VerificationStatus.Completed:
                            //all, irrespective of related opportunity and organization status
                            query.OrderByDescending(o => o.DateCompleted);
                            break;

                        case VerificationStatus.Rejected:
                            //all, irrespective of related opportunity and organization status
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
            result.Items.ForEach(o => o.Verifications?.ForEach(v => v.FileURL = GetBlobObjectURL(v.FileId)));
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

        public async Task PerformActionSaved(Guid opportunityId)
        {
            //published opportunities (irrespective of started)
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (!opportunity.Published)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be actioned (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

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
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (!opportunity.Published)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be actioned (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;
            var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);

            if (myOpportunity == null) return; //not saved

            await _myOpportunityRepository.Delete(myOpportunity);
        }

        public async Task PerformActionSendForVerification(Guid opportunityId, MyOpportunityRequestVerify request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _myOpportunityRequestValidatorVerify.ValidateAndThrowAsync(request);

            //provided opportunity is published (and started) or expired
            var opportunity = _opportunityService.GetById(opportunityId, true, false);
            var canSendForVerification = opportunity.Status == Opportunity.Status.Expired;
            if (!canSendForVerification) canSendForVerification = opportunity.Published && opportunity.DateStart <= DateTimeOffset.Now;
            if (!canSendForVerification)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can no longer be send for verification (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            if (!opportunity.VerificationSupported)
                throw new ValidationException($"Opportunity '{opportunity.Title}' can not be completed / does not support verification");
            else if (opportunity.VerificationTypes == null || !opportunity.VerificationTypes.Any())
                throw new DataInconsistencyException("Verification supported but opportunity has no mapped verification types");

            if (request.DateStart.HasValue && request.DateStart.Value < opportunity.DateStart)
                throw new ValidationException($"Start date can not be earlier than the opportunity stated date of '{opportunity.DateStart}'");

            if (request.DateEnd.HasValue && opportunity.DateEnd.HasValue && request.DateEnd.Value > opportunity.DateEnd.Value)
                throw new ValidationException($"End date can not be later than the opportunity end date of '{opportunity.DateEnd}'");

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

            var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
            var verificationStatusPendingId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Pending.ToString()).Id;

            var myOpportunity = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId);
            var isNew = myOpportunity == null;

            if (myOpportunity == null)
                myOpportunity = new Models.MyOpportunity
                {
                    Id = Guid.NewGuid(),
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
                    case VerificationStatus.Completed:
                        throw new ValidationException($"Verification is {myOpportunity.VerificationStatus?.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

                    case VerificationStatus.Rejected: //can be re-send for verification
                        break;

                    default:
                        throw new InvalidOperationException($"Unknown / unsupported '{nameof(myOpportunity.VerificationStatus)}' of '{myOpportunity.VerificationStatus.Value}'");
                }
            }

            myOpportunity.VerificationStatusId = verificationStatusPendingId;
            myOpportunity.DateStart = request.DateStart.RemoveTime();
            myOpportunity.DateEnd = request.DateEnd.ToEndOfDay();

            await PerformActionSendForVerification(request, opportunity, myOpportunity, isNew);
        }

        public async Task FinalizeVerification(MyOpportunityRequestVerifyFinalizeBatch request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.Items == null)
                throw new ArgumentNullException(nameof(request), "No items specified");

            // request validated by FinalizeVerification
            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            foreach (var item in request.Items)
            {
                await FinalizeVerification(new MyOpportunityRequestVerifyFinalize
                {
                    OpportunityId = item.OpportunityId,
                    UserId = item.UserId,
                    Status = request.Status,
                    Comment = request.Comment
                });
            }
        }

        //supported statuses: Rejected or Completed
        public async Task FinalizeVerification(MyOpportunityRequestVerifyFinalize request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _myOpportunityRequestValidatorVerifyFinalize.ValidateAndThrowAsync(request);

            var user = _userService.GetById(request.UserId, false);

            //can complete, provided opportunity is published (and started) or expired (actioned prior to expiration)
            var opportunity = _opportunityService.GetById(request.OpportunityId, false, false);
            var canFinalize = opportunity.Status == Opportunity.Status.Expired;
            if (!canFinalize) canFinalize = opportunity.Published && opportunity.DateStart <= DateTimeOffset.Now;
            if (!canFinalize)
                throw new ValidationException($"Verification for opportunity '{opportunity.Title}' can no longer be finalized (published '{opportunity.Published}' status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
            var item = _myOpportunityRepository.Query(false).SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
                ?? throw new ValidationException($"Opportunity '{opportunity.Title}' has not been sent for verification for user '{user.Email}'");

            if (item.VerificationStatus != VerificationStatus.Pending)
                throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for 'my' opportunity '{opportunity.Title}'");

            if (item.VerificationStatus == request.Status) return;

            var statusId = _myOpportunityVerificationStatusService.GetByName(request.Status.ToString()).Id;

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

            item.VerificationStatusId = statusId;
            item.CommentVerification = request.Comment;

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

        private async Task PerformActionSendForVerification(MyOpportunityRequestVerify request, Opportunity.Models.Opportunity opportunity, Models.MyOpportunity myOpportunity, bool isNew)
        {
            var itemsExisting = new List<MyOpportunityVerification>();
            var itemsExistingDeleted = new List<MyOpportunityVerification>();
            var itemsNewBlobs = new List<BlobObject>();
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                if (isNew)
                    await _myOpportunityRepository.Create(myOpportunity);
                else
                {
                    //track existing (to be deleted)
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

                    await _myOpportunityRepository.Update(myOpportunity);
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
                            case Opportunity.VerificationType.FileUpload:
                                if (request.Certificate == null)
                                    throw new ValidationException($"Verification type '{verificationType.Type}': Certificate required");

                                blobObject = await _blobService.Create(request.Certificate, FileType.Certificates);
                                break;

                            case Opportunity.VerificationType.Picture:
                                if (request.Picture == null)
                                    throw new ValidationException($"Verification type '{verificationType.Type}': Picture required");

                                blobObject = await _blobService.Create(request.Picture, FileType.Photos);
                                break;

                            case Opportunity.VerificationType.VoiceNote:
                                if (request.VoiceNote == null)
                                    throw new ValidationException($"Verification type '{verificationType.Type}': Voice note required");

                                blobObject = await _blobService.Create(request.VoiceNote, FileType.VoiceNotes);
                                break;

                            case Opportunity.VerificationType.Location:
                                if (request.Geometry == null)
                                    throw new ValidationException($"Verification type '{verificationType.Type}': Geometry required");

                                if (request.Geometry.SpatialType != SpatialType.Point)
                                    throw new ValidationException($"Verification type '{verificationType.Type}': Spatial type '{SpatialType.Point}' required");

                                itemType.GeometryProperties = JsonConvert.SerializeObject(request.Geometry);
                                break;

                            default:
                                throw new InvalidOperationException($"Unknown / unsupported '{nameof(Opportunity.VerificationType)}' of '{verificationType.Type}'");
                        }

                        //create new item in db
                        if (blobObject != null)
                        {
                            itemType.FileId = blobObject.Id;
                            itemsNewBlobs.Add(blobObject);
                        }

                        await _myOpportunityVerificationRepository.Create(itemType);
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

                scope.Complete();
            }
            catch //roll back
            {
                //re-upload existing items to blob storage
                foreach (var item in itemsExistingDeleted)
                {
                    if (!item.FileId.HasValue || item.File == null)
                        throw new InvalidOperationException("File expected");

                    var fileType = item.VerificationType.ToFileType() ?? throw new InvalidOperationException("File type expected");
                    await _blobService.Create(item.FileId.Value, item.File, fileType);
                }

                //delete newly create items in blob storage
                foreach (var item in itemsNewBlobs)
                    await _blobService.Delete(item.Key);

                throw;
            }
        }
        #endregion
    }
}
