using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Flurl;

namespace Yoma.Core.Domain.Entity.Services
{
    public class OrganizationBackgroundService : IOrganizationBackgroundService
    {
        #region Class Variables
        private readonly ILogger<OrganizationBackgroundService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IEmailProviderClient _emailProviderClient;
        private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;
        private static readonly OrganizationStatus[] Statuses_Declination = { OrganizationStatus.Inactive };
        private static readonly OrganizationStatus[] Statuses_Deletion = { OrganizationStatus.Declined };

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public OrganizationBackgroundService(ILogger<OrganizationBackgroundService> logger,
            IOptions<AppSettings> appSettings,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IOrganizationStatusService organizationStatusService,
            IEmailProviderClientFactory emailProviderClientFactory,
            IRepositoryBatchedValueContainsWithNavigation<Organization> organizationRepository)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _organizationStatusService = organizationStatusService;
            _emailProviderClient = emailProviderClientFactory.CreateClient();
            _organizationRepository = organizationRepository;
        }
        #endregion

        #region Public Memebers
        public void ProcessDeclination()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing organization declination");

                var statusDeclinationIds = Statuses_Declination.Select(o => _organizationStatusService.GetByName(o.ToString()).Id).ToList();
                var statusDeclinedId = _organizationStatusService.GetByName(OrganizationStatus.Declined.ToString()).Id;

                do
                {
                    var items = _organizationRepository.Query(true).Where(o => statusDeclinationIds.Contains(o.StatusId) &&
                        o.DateModified <= DateTimeOffset.Now.AddDays(-_scheduleJobOptions.OrganizationDeclinationIntervalInDays))
                        .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OrganizationDeclinationBatchSize).ToList();
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        item.CommentApproval = $"Auto-Declined due to being {string.Join("/", Statuses_Declination).ToLower()} for more than {_scheduleJobOptions.OrganizationDeclinationIntervalInDays} days";
                        item.StatusId = statusDeclinedId;
                        _logger.LogInformation("Organization with id '{id}' flagged for declination", item.Id);
                    }

                    items = _organizationRepository.Update(items).Result;

                    var groupedOrganizations = items
                        .SelectMany(org => org.Administrators ?? Enumerable.Empty<UserInfo>(), (org, admin) => new { Administrator = admin, Organization = org })
                        .GroupBy(item => item.Administrator, item => item.Organization);

                    var emailType = EmailProvider.EmailType.Organization_Approval_Declined;
                    foreach (var group in groupedOrganizations)
                    {
                        try
                        {
                            var recipients = new List<EmailRecipient>
                        {
                            new EmailRecipient { Email = group.Key.Email, DisplayName = group.Key.DisplayName }
                        };

                            var data = new EmailOrganizationApproval { Organizations = new List<EmailOrganizationApprovalItem>() };
                            foreach (var org in group)
                            {
                                data.Organizations.Add(new EmailOrganizationApprovalItem
                                {
                                    Name = org.Name,
                                    Comment = org.CommentApproval,
                                    URL = _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(org.Id).ToUri().ToString()
                                });
                            }

                            _emailProviderClient.Send(emailType, recipients, data).Wait();

                            _logger.LogInformation("Successfully send '{emailType}' email", emailType);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to send '{emailType}' email", emailType);
                        }
                    }
                } while (true);

                _logger.LogInformation("Processed organization declination");
            }
        }

        public void ProcessDeletion()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same transactions on multiple threads
            {
                _logger.LogInformation("Processing organization deletion");

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
                        _logger.LogInformation("Organization with id '{id}' flagged for deletion", item.Id);
                    }

                    _organizationRepository.Update(items).Wait();

                } while (true);

                _logger.LogInformation("Processed organization deletion");
            }
        }
        #endregion
    }
}
