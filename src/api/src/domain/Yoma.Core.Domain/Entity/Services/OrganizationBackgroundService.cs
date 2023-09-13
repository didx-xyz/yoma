using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Microsoft.Extensions.Options;

namespace Yoma.Core.Domain.Entity.Services
{
    public class OrganizationBackgroundService : IOrganizationBackgroundService
    {
        #region Class Variables
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IRepositoryValueContainsWithNavigation<Organization> _organizationRepository;
        private static readonly OrganizationStatus[] Statuses_Declination = { OrganizationStatus.Inactive };
        private static readonly OrganizationStatus[] Statuses_Deletion = { OrganizationStatus.Declined };
        #endregion

        #region Constructor
        public OrganizationBackgroundService(IOptions<ScheduleJobOptions> scheduleJobOptions,
            IOrganizationStatusService organizationStatusService,
            IRepositoryValueContainsWithNavigation<Organization> organizationRepository)
        {
            _scheduleJobOptions = scheduleJobOptions.Value;
            _organizationStatusService = organizationStatusService;
            _organizationRepository = organizationRepository;
        }
        #endregion

        #region Public Memebers
        public async Task ProcessDeclination()
        {
            var statusDeclinationIds = Statuses_Declination.Select(o => _organizationStatusService.GetByName(o.ToString()).Id).ToList();
            var statusDeclinedId = _organizationStatusService.GetByName(OrganizationStatus.Declined.ToString()).Id;

            do
            {
                var items = _organizationRepository.Query().Where(o => statusDeclinationIds.Contains(o.StatusId) &&
                    o.DateModified <= DateTimeOffset.Now.AddDays(-_scheduleJobOptions.OrganizationDeclinationIntervalInDays))
                    .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OrganizationDeclinationBatchSize).ToList();
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    item.StatusId = statusDeclinedId;
                    await _organizationRepository.Update(item);
                }

            } while (true);
        }

        public async Task ProcessDeletion()
        {
            var statusDeletionIds = Statuses_Deletion.Select(o => _organizationStatusService.GetByName(o.ToString()).Id).ToList();
            var statusDeletedId = _organizationStatusService.GetByName(OrganizationStatus.Deleted.ToString()).Id;

            do
            {
                var items = _organizationRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
                    o.DateModified <= DateTimeOffset.Now.AddDays(-_scheduleJobOptions.OrganizationDeletionIntervalInDays))
                    .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OrganizationDeletionBatchSize).ToList();
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    item.StatusId = statusDeletedId;
                    await _organizationRepository.Update(item);
                }

            } while (true);
        }
        #endregion
    }
}
