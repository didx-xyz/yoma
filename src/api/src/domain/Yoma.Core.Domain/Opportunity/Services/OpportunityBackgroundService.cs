using Flurl;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Opportunity.Services
{
    public class OpportunityBackgroundService : IOpportunityBackgroundService
    {
        #region Class Variables
        private readonly ILogger<OpportunityBackgroundService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IOpportunityStatusService _opportunityStatusService;
        private readonly IOrganizationService _organizationService;
        private readonly IEmailProviderClient _emailProviderClient;
        private readonly IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> _opportunityRepository;
        private static readonly Status[] Statuses_Expirable = { Status.Active, Status.Inactive };
        private static readonly Status[] Statuses_Deletion = { Status.Inactive, Status.Expired };

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public OpportunityBackgroundService(ILogger<OpportunityBackgroundService> logger,
            IOptions<AppSettings> appSettings,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IOpportunityStatusService opportunityStatusService,
            IOrganizationService organizationService,
            IEmailProviderClientFactory emailProviderClientFactory,
            IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> opportunityRepository)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _opportunityStatusService = opportunityStatusService;
            _organizationService = organizationService;
            _emailProviderClient = emailProviderClientFactory.CreateClient();
            _opportunityRepository = opportunityRepository;
        }
        #endregion

        #region Public Members
        public void ProcessExpiration()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
                var statusExpirableIds = Statuses_Expirable.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();

                do
                {
                    var items = _opportunityRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
                        o.DateEnd.HasValue && o.DateEnd.Value <= DateTimeOffset.Now).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.OpportunityExpirationBatchSize).ToList();
                    if (!items.Any()) break;

                    foreach (var item in items)
                        item.StatusId = statusExpiredId;

                    _opportunityRepository.Update(items).Wait();

                    SendEmail(items, EmailType.Opportunity_Expiration_Expired).Wait();

                } while (true);
            }
        }

        public void ProcessExpirationNotifications()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                var datetimeFrom = new DateTimeOffset(DateTime.Today);
                var datetimeTo = datetimeFrom.AddDays(_scheduleJobOptions.OpportunityExpirationNotificationIntervalInDays);
                var statusExpirableIds = Statuses_Expirable.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();

                do
                {
                    var items = _opportunityRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
                        o.DateEnd.HasValue && o.DateEnd.Value >= datetimeFrom && o.DateEnd.Value <= datetimeTo)
                        .OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.OpportunityExpirationBatchSize).ToList();
                    if (!items.Any()) break;

                    SendEmail(items, EmailType.Opportunity_Expiration_WithinNextDays).Wait();

                } while (true);
            }
        }

        public void ProcessDeletion()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                var statusDeletionIds = Statuses_Deletion.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
                var statusDeletedId = _opportunityStatusService.GetByName(Status.Deleted.ToString()).Id;

                do
                {
                    var items = _opportunityRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
                        o.DateModified <= DateTimeOffset.Now.AddDays(-_scheduleJobOptions.OpportunityDeletionIntervalInDays))
                        .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OpportunityDeletionBatchSize).ToList();
                    if (!items.Any()) break;

                    foreach (var item in items)
                        item.StatusId = statusDeletedId;

                    _opportunityRepository.Update(items).Wait();

                } while (true);
            }
        }
        #endregion

        #region Private Members
        private async Task SendEmail(List<Models.Opportunity> items, EmailType type)
        {
            var groupedOpportunities = items
                .SelectMany(op => _organizationService.ListAdmins(op.OrganizationId, false) ?? Enumerable.Empty<UserInfo>(), (op, admin) => new { Administrator = admin, Opportunity = op })
                .GroupBy(item => item.Administrator, item => item.Opportunity);

            foreach (var group in groupedOpportunities)
            {
                try
                {
                    var recipients = new List<EmailRecipient>
                        {
                            new EmailRecipient { Email = group.Key.Email, DisplayName = group.Key.DisplayName }
                        };

                    var data = new EmailOpportunityExpiration
                    {
                        WithinNextDays = _scheduleJobOptions.OpportunityExpirationNotificationIntervalInDays,
                        Opportunities = new List<EmailOpportunityExpirationItem>()
                    };

                    foreach (var op in group)
                    {
                        data.Opportunities.Add(new EmailOpportunityExpirationItem
                        {
                            Title = op.Title,
                            DateStart = op.DateStart,
                            DateEnd = op.DateEnd,
                            URL = _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(op.Id).ToUri().ToString()
                        });
                    }

                    await _emailProviderClient.Send(type, recipients, data);

                    _logger.LogInformation("Successfully send '{emailType}' email", type);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send '{emailType}' email", type);
                }
            }
        }
        #endregion
    }
}
