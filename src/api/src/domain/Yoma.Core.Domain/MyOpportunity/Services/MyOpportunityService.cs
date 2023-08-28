using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;

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
        private readonly IBlobService _blobService;
        private readonly IRepository<Models.MyOpportunity> _myOpportunityRepository;

        private static readonly Opportunity.Status[] Opportunity_Statuses_Actionable = { Opportunity.Status.Active };
        private static readonly Opportunity.Status[] Opportunity_Statuses_Verifyable = { Opportunity.Status.Active, Opportunity.Status.Expired };
        #endregion

        #region Constructor
        public MyOpportunityService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IOpportunityService opportunityService,
            IMyOpportunityActionService myOpportunityActionService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IBlobService blobService,
            IRepository<Models.MyOpportunity> myOpportunityRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _opportunityService = opportunityService;
            _myOpportunityActionService = myOpportunityActionService;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _blobService = blobService;
            _myOpportunityRepository = myOpportunityRepository;
        }
        #endregion

        #region Public Members
        public async Task PerformActionViewed(Guid opportunityId)
        {
            var opportunity = GetOpportunityByIdAndValidateStatus(opportunityId, Opportunity_Statuses_Actionable);
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));

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
            var opportunity = GetOpportunityByIdAndValidateStatus(opportunityId, Opportunity_Statuses_Actionable);
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));

            var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;

            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);
            if (item != null) return; //already saved

            item = new Models.MyOpportunity
            {
                UserId = user.Id,
                OpportunityId = opportunity.Id,
                ActionId = actionSavedId
            };

            await _myOpportunityRepository.Create(item);
        }

        public async Task PerformActionSavedRemove(Guid opportunityId)
        {
            var opportunity = GetOpportunityByIdAndValidateStatus(opportunityId, Opportunity_Statuses_Actionable);
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));

            var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;
            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);

            if (item == null) return; //not saved

            await _myOpportunityRepository.Delete(item);
        }

        public async Task PerformActionSendForVerification(Guid opportunityId, MyOpportunityVerifyRequest request)
        {
            var opportunity = GetOpportunityByIdAndValidateStatus(opportunityId, Opportunity_Statuses_Actionable);
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));

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
                    case VerificationStatus.Pending:
                    case VerificationStatus.Completed:
                        throw new ValidationException($"Verification is {item.VerificationStatus?.ToString().ToLower()} for 'my' opportunity with id '{item.Id}'");

                    case VerificationStatus.Rejected: //can be re-send for verification
                        break;
                }
            }

            item.VerificationStatusId = verificationStatusPendingId;
            item.DateStart = request.DateStart;
            item.DateEnd = request.DateEnd;

            var currentCertificate = item.CertificateId.HasValue ? new { Id = item.CertificateId.Value, File = await _blobService.Download(item.CertificateId.Value) } : null;

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            BlobObject? blobObject = null;
            try
            {
                blobObject = await _blobService.Create(request.Certificate, FileType.Photos);
                item.CertificateId = blobObject.Id;

                if (isNew)
                    await _myOpportunityRepository.Create(item);
                else
                    await _myOpportunityRepository.Update(item);

                if (currentCertificate != null)
                    await _blobService.Delete(currentCertificate.Id);

                scope.Complete();
            }
            catch
            {
                if (blobObject != null)
                    await _blobService.Delete(blobObject.Key);

                 if (currentCertificate != null)
                    await _blobService.Create(currentCertificate.Id, currentCertificate.File, FileType.Photos);

                throw;
            }

            //TODO: Send email (youth and OP)
        }


        //supported statuses: Rejected or Completed
        public async Task UpdateVerificationStatus(Guid userId, Guid opportunityId, VerificationStatus status)
        {
            var opportunity = GetOpportunityByIdAndValidateStatus(opportunityId, Opportunity_Statuses_Verifyable);
            var user = _userService.GetById(userId);

            var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId)
                ?? throw new ValidationException($"Opportunity id '{opportunity.Id}' and user '{user.Id}' has not been sent for verification");

            if (item.VerificationStatus != VerificationStatus.Pending)
                throw new ValidationException($"Verification is not {VerificationStatus.Pending.ToString().ToLower()} for 'my' opportunity with id '{item.Id}'");

            if (item.VerificationStatus == status) return;

            var statusId = _myOpportunityVerificationStatusService.GetByName(status.ToString()).Id;

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            item.VerificationStatusId = statusId;
            if (status == VerificationStatus.Completed)
            {
                var (zltoReward, yomaReward) = await _opportunityService.ProcessVerificationCompletion(opportunity.Id, true);

                item.ZltoReward = zltoReward;
                item.YomaReward = yomaReward;
                item.DateCompleted = DateTimeOffset.Now;
            }

            await _myOpportunityRepository.Update(item);

            //TODO: Send email (youth)
        }
        #endregion

        #region Private Members
        private Opportunity.Models.Opportunity GetOpportunityByIdAndValidateStatus(Guid opportunityId, Opportunity.Status[] statuses)
        {
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (!statuses.Contains(opportunity.Status))
                throw new ArgumentException($"Opportunity can no longer be verified (current status '{opportunity.Status}')", nameof(opportunityId));

            if (opportunity.DateStart > DateTimeOffset.Now)
                throw new InvalidOperationException($"Opportunity is active but has not started (start date '{opportunity.DateStart}')");

            return opportunity;
        }
        #endregion
    }
}
