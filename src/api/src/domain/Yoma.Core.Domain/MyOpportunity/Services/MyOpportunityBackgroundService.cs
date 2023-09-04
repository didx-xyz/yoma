using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Services
{
    public class MyOpportunityBackgroundService : IMyOpportunityBackgroundService
    {
        #region Class Variables
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IRepository<Models.MyOpportunity> _myOpportunityRepository;

        private static readonly VerificationStatus[] Statuses_Rejectable = { VerificationStatus.Pending };
        #endregion

        #region Constructor
        public MyOpportunityBackgroundService(IOptions<ScheduleJobOptions> scheduleJobOptions,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IRepository<Models.MyOpportunity> myOpportunityRepository)
        {
            _scheduleJobOptions = scheduleJobOptions.Value;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _myOpportunityRepository = myOpportunityRepository;
        }
        #endregion

        #region Public Members
        public async Task ProcessVerificationRejection()
        {
            var statusRejectedId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Rejected.ToString()).Id;
            var statusRejectableIds = Statuses_Rejectable.Select(o => _myOpportunityVerificationStatusService.GetByName(o.ToString()).Id).ToList();

            do
            {
                var items = _myOpportunityRepository.Query().Where(o => o.VerificationStatusId.HasValue && statusRejectableIds.Contains(o.VerificationStatusId.Value) &&
                  o.DateModified <= DateTimeOffset.Now.AddDays(-_scheduleJobOptions.MyOpportunityRejectionIntervalInDays))
                  .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OpportunityDeletionBatchSize).ToList();
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    item.VerificationStatusId = statusRejectedId;
                    await _myOpportunityRepository.Update(item);
                }
            } while (true);
        }
        #endregion
    }
}
