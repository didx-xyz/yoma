using Flurl;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Services
{
    public class MyOpportunityBackgroundService : IMyOpportunityBackgroundService
    {
        #region Class Variables
        private readonly ILogger<MyOpportunityBackgroundService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IEmailProviderClient _emailProviderClient;
        private readonly IRepositoryBatchedWithNavigation<Models.MyOpportunity> _myOpportunityRepository;

        private static readonly VerificationStatus[] Statuses_Rejectable = { VerificationStatus.Pending };

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public MyOpportunityBackgroundService(ILogger<MyOpportunityBackgroundService> logger,
            IOptions<AppSettings> appSettings,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IEmailProviderClientFactory emailProviderClientFactory,
            IRepositoryBatchedWithNavigation<Models.MyOpportunity> myOpportunityRepository)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _emailProviderClient = emailProviderClientFactory.CreateClient();
            _myOpportunityRepository = myOpportunityRepository;
        }
        #endregion

        #region Public Members
        public void ProcessVerificationRejection()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
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
                        item.CommentVerification = $"Auto-Rejected due to being {string.Join("/", Statuses_Rejectable).ToLower()} for more than {_scheduleJobOptions.MyOpportunityRejectionIntervalInDays} days";
                        item.VerificationStatusId = statusRejectedId;
                    }

                    items = _myOpportunityRepository.Update(items).Result;

                    var groupedMyOpportunities = items.GroupBy(item => new { item.UserEmail, item.UserDisplayName });

                    var emailType = EmailType.Opportunity_Verification_Rejected;
                    foreach (var group in groupedMyOpportunities)
                    {
                        try
                        {
                            var recipients = new List<EmailRecipient>
                        {
                            new EmailRecipient { Email = group.Key.UserEmail, DisplayName = group.Key.UserDisplayName }
                        };

                            var data = new EmailOpportunityVerification
                            {
                                Opportunities = new List<EmailOpportunityVerificationItem>()
                            };

                            foreach (var myOp in group)
                            {
                                data.Opportunities.Add(new EmailOpportunityVerificationItem
                                {
                                    Title = myOp.OpportunityTitle,
                                    DateStart = myOp.DateStart,
                                    DateEnd = myOp.DateEnd,
                                    Comment = myOp.CommentVerification,
                                    URL = _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(myOp.Id).ToUri().ToString(),
                                    ZltoReward = myOp.ZltoReward,
                                    YomaReward = myOp.YomaReward
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
            }
        }
        #endregion
    }
}
