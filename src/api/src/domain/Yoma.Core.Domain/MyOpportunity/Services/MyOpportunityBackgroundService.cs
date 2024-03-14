using Flurl;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Services
{
    public class MyOpportunityBackgroundService : IMyOpportunityBackgroundService
    {
        #region Class Variables
        private readonly ILogger<MyOpportunityBackgroundService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IEnvironmentProvider _environmentProvider;
        private readonly IMyOpportunityService _myOpportunityService;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IMyOpportunityActionService _myOpportunityActionService;
        private readonly IOpportunityService _opportunityService;
        private readonly IEmailProviderClient _emailProviderClient;
        private readonly IRepositoryBatchedWithNavigation<Models.MyOpportunity> _myOpportunityRepository;
        private readonly IRepository<MyOpportunityVerification> _myOpportunityVerificationRepository;

        private static readonly VerificationStatus[] Statuses_Rejectable = { VerificationStatus.Pending };

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public MyOpportunityBackgroundService(ILogger<MyOpportunityBackgroundService> logger,
            IOptions<AppSettings> appSettings,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IEnvironmentProvider environmentProvider,
            IMyOpportunityService myOpportunityService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IMyOpportunityActionService myOpportunityActionService,
            IOpportunityService opportunityService,
            IEmailProviderClientFactory emailProviderClientFactory,
            IRepositoryBatchedWithNavigation<Models.MyOpportunity> myOpportunityRepository,
            IRepository<MyOpportunityVerification> myOpportunityVerificationRepository)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _environmentProvider = environmentProvider;
            _myOpportunityService = myOpportunityService;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _myOpportunityActionService = myOpportunityActionService;
            _opportunityService = opportunityService;
            _emailProviderClient = emailProviderClientFactory.CreateClient();
            _myOpportunityRepository = myOpportunityRepository;
            _myOpportunityVerificationRepository = myOpportunityVerificationRepository;
        }
        #endregion

        #region Public Members
        public void ProcessVerificationRejection()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing 'my' opportunity verification rejection");

                var statusRejectedId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Rejected.ToString()).Id;
                var statusRejectableIds = Statuses_Rejectable.Select(o => _myOpportunityVerificationStatusService.GetByName(o.ToString()).Id).ToList();

                do
                {
                    var items = _myOpportunityRepository.Query().Where(o => o.VerificationStatusId.HasValue && statusRejectableIds.Contains(o.VerificationStatusId.Value) &&
                      o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.MyOpportunityRejectionIntervalInDays))
                      .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OpportunityDeletionBatchSize).ToList();
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        item.CommentVerification = $"Auto-Rejected due to being {string.Join("/", Statuses_Rejectable).ToLower()} for more than {_scheduleJobOptions.MyOpportunityRejectionIntervalInDays} days";
                        item.VerificationStatusId = statusRejectedId;
                        _logger.LogInformation("'My' opportunity with id '{id}' flagged for verification rejection", item.Id);
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
                                YoIDURL = _appSettings.AppBaseURL.AppendPathSegment("yoid/opportunities/declined").ToUri().ToString(),
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

                            _logger.LogInformation("Successfully send email");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to send email");
                        }
                    }

                } while (true);

                _logger.LogInformation("Processed 'my' opportunity verification rejection");
            }
        }

        public void SeedPendingVerifications()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                if (!_appSettings.TestDataSeedingEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
                {
                    _logger.LogInformation("Pending verification seeding skipped for environment '{environment}'", _environmentProvider.Environment);
                    return;
                }

                _logger.LogInformation("Processing pending verification seeding seeding");

                var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
                var verificationStatusPendingId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Pending.ToString()).Id;

                var items = _myOpportunityRepository.Query(true).Where(
                    o => !_myOpportunityVerificationRepository.Query().Any(mv => mv.MyOpportunityId == o.Id)
                    && o.ActionId == actionVerificationId && o.VerificationStatusId == verificationStatusPendingId).ToList();

                SeedPendingVerifications(items);

                _logger.LogInformation("Processed pending verification seeding");
            }
        }
        #endregion

        #region Private Members
        private void SeedPendingVerifications(List<Models.MyOpportunity> items)
        {
            if (!items.Any()) return;

            foreach (var item in items)
            {
                try
                {
                    var opportunity = _opportunityService.GetById(item.OpportunityId, true, true, false);
                    if (opportunity.VerificationTypes == null || !opportunity.VerificationTypes.Any()) continue;

                    var request = new MyOpportunityRequestVerify
                    {
                        DateStart = item.DateStart.HasValue ? item.DateStart.Value.AddHours(1) : null,
                        DateEnd = item.DateEnd.HasValue ? item.DateEnd.Value.AddHours(-1) : null
                    };

                    foreach (var verificationType in opportunity.VerificationTypes)
                    {
                        var assembly = Assembly.GetExecutingAssembly();

                        switch (verificationType.Type)
                        {
                            case VerificationType.FileUpload:
                                var resourcePathCertificate = "Yoma.Core.Domain.MyOpportunity.SampleBlobs.sample_certificate.pdf";

                                using (var resourceStream = assembly.GetManifestResourceStream(resourcePathCertificate))
                                {
                                    if (resourceStream == null)
                                        throw new InvalidOperationException($"Embedded resource '{resourcePathCertificate}' not found");

                                    byte[] resourceBytes;
                                    using (var memoryStream = new MemoryStream())
                                    {
                                        resourceStream.CopyTo(memoryStream);
                                        resourceBytes = memoryStream.ToArray();
                                    }

                                    var fileName = string.Join('.', resourcePathCertificate.Split('.').Reverse().Take(2).Reverse());
                                    var fileExtension = Path.GetExtension(fileName)[1..];

                                    request.Certificate = FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes);
                                }

                                break;

                            case VerificationType.Picture:
                                var resourcePathPicture = "Yoma.Core.Domain.MyOpportunity.SampleBlobs.sample_photo.png";

                                using (var resourceStream = assembly.GetManifestResourceStream(resourcePathPicture))
                                {
                                    if (resourceStream == null)
                                        throw new InvalidOperationException($"Embedded resource '{resourcePathPicture}' not found");

                                    byte[] resourceBytes;
                                    using (var memoryStream = new MemoryStream())
                                    {
                                        resourceStream.CopyTo(memoryStream);
                                        resourceBytes = memoryStream.ToArray();
                                    }

                                    var fileName = string.Join('.', resourcePathPicture.Split('.').Reverse().Take(2).Reverse());
                                    var fileExtension = Path.GetExtension(fileName)[1..];

                                    request.Picture = FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes);
                                }
                                break;

                            case VerificationType.VoiceNote:
                                var resourcePathVoiceNote = "Yoma.Core.Domain.MyOpportunity.SampleBlobs.sample_voice_note.wav";

                                using (var resourceStream = assembly.GetManifestResourceStream(resourcePathVoiceNote))
                                {
                                    if (resourceStream == null)
                                        throw new InvalidOperationException($"Embedded resource '{resourcePathVoiceNote}' not found");

                                    byte[] resourceBytes;
                                    using (var memoryStream = new MemoryStream())
                                    {
                                        resourceStream.CopyTo(memoryStream);
                                        resourceBytes = memoryStream.ToArray();
                                    }

                                    var fileName = string.Join('.', resourcePathVoiceNote.Split('.').Reverse().Take(2).Reverse());
                                    var fileExtension = Path.GetExtension(fileName)[1..];

                                    request.VoiceNote = FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes);
                                }
                                break;

                            case VerificationType.Location:
                                request.Geometry = new Geometry
                                {
                                    Type = Core.SpatialType.Point,
                                    Coordinates = new List<double[]> { new[] { -0.09394821166991196, 51.50525376803295, 0 } }
                                };
                                break;

                            default:
                                throw new InvalidOperationException($"Unknown / unsupported '{nameof(VerificationType)}' of '{verificationType.Type}'");
                        }
                    }

                    _myOpportunityService.PerformActionSendForVerificationManual(item.UserId, item.OpportunityId, request, true).Wait();

                }
                catch (FluentValidation.ValidationException ex)
                {
                    _logger.LogError(ex, "Pending verification seeding validation failed. Seeding skipped / no longer seed-able for item with id '{id}'", item.Id);
                }
                catch (ValidationException ex)
                {
                    _logger.LogError(ex, "Pending verification seeding validation failed. Seeding skipped / no longer seed-able for item with id '{id}'", item.Id);
                }
            }
            #endregion
        }
    }
}
