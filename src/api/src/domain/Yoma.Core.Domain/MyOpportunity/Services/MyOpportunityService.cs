using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services.Lookups;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Services
{
    public class MyOpportunityService : IMyOpportunityService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IOpportunityService _opportunityService;
        private readonly IOrganizationService _organizationService;
        private readonly IMyOpportunityActionService _myOpportunityActionService;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IRepository<Models.MyOpportunity> _myOpportunityRepository;
        #endregion

        #region Constructor
        public MyOpportunityService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IOpportunityService opportunityService,
            IOrganizationService organizationService,
            IMyOpportunityActionService myOpportunityActionService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IRepository<Models.MyOpportunity> myOpportunityRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _opportunityService = opportunityService;
            _organizationService = organizationService;
            _myOpportunityActionService = myOpportunityActionService;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _myOpportunityRepository = myOpportunityRepository;
        }
        #endregion

        #region Public Members
        public async Task PerformActionViewed(Guid opportunityId)
        {
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (opportunity.Status != Opportunity.Status.Active)
                throw new ArgumentException($"{nameof(Opportunity.Models.Opportunity)} can no longer be viewed (current status '{opportunity.Status}')", nameof(opportunityId));

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
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (opportunity.Status != Opportunity.Status.Active)
                throw new ArgumentException($"{nameof(Opportunity.Models.Opportunity)} can no longer be saved (current status '{opportunity.Status}')", nameof(opportunityId));

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
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (opportunity.Status != Opportunity.Status.Active)
                throw new ArgumentException($"{nameof(Opportunity.Models.Opportunity)} can no longer be un-saved (current status '{opportunity.Status}')", nameof(opportunityId));

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));

            var actionSavedId = _myOpportunityActionService.GetByName(Action.Saved.ToString()).Id;
            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionSavedId);

            if (item == null) return; //not saved

            await _myOpportunityRepository.Delete(item);
        }

        public async Task PerformActionSendForVerification(Guid opportunityId, MyOpportunityVerifyRequest request)
        {
            var opportunity = _opportunityService.GetById(opportunityId, false, false);
            if (opportunity.Status != Opportunity.Status.Active)
                throw new ArgumentException($"{nameof(Opportunity.Models.Opportunity)} can no longer be verified (current status '{opportunity.Status}')", nameof(opportunityId));

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));

            var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;

            var item = _myOpportunityRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.OpportunityId == opportunity.Id && o.ActionId == actionVerificationId);

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            if (item == null)
            {

            }
            else
            {
                switch (item.VerificationStatus)
                {
                    case VerificationStatus.Pending:
                    case VerificationStatus.Completed:
                        throw new ValidationException($"Verification is {item.VerificationStatus.ToString().ToLower()} for 'my' opportunity with id '{item.Id}'");

                    case VerificationStatus.Rejected: //can be re-send for verification
                        item.DateStart = request.DateStart;
                        break;
                }
            }
        }

        public Task UpdateVerificationStatus(Guid userId, Guid opportunityId, VerificationStatus status)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
