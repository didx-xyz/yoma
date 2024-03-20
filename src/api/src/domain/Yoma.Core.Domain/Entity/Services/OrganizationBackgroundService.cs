using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Core.Helpers;
using System.Reflection;
using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.Entity.Services
{
    public class OrganizationBackgroundService : IOrganizationBackgroundService
    {
        #region Class Variables
        private readonly ILogger<OrganizationBackgroundService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IEnvironmentProvider _environmentProvider;
        private readonly IOrganizationService _organizationService;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IEmailProviderClient _emailProviderClient;
        private readonly IUserService _userService;
        private readonly IEmailURLFactory _emailURLFactory;
        private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;
        private readonly IRepository<OrganizationDocument> _organizationDocumentRepository;
        private static readonly OrganizationStatus[] Statuses_Declination = { OrganizationStatus.Inactive };
        private static readonly OrganizationStatus[] Statuses_Deletion = { OrganizationStatus.Declined };

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public OrganizationBackgroundService(ILogger<OrganizationBackgroundService> logger,
            IOptions<AppSettings> appSettings,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IEnvironmentProvider environmentProvider,
            IOrganizationService organizationService,
            IOrganizationStatusService organizationStatusService,
            IEmailProviderClientFactory emailProviderClientFactory,
            IUserService userService,
            IEmailURLFactory emailURLFactory,
            IRepositoryBatchedValueContainsWithNavigation<Organization> organizationRepository,
            IRepository<OrganizationDocument> organizationDocumentRepository)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _environmentProvider = environmentProvider;
            _organizationService = organizationService;
            _organizationStatusService = organizationStatusService;
            _emailProviderClient = emailProviderClientFactory.CreateClient();
            _userService = userService;
            _emailURLFactory = emailURLFactory;
            _organizationRepository = organizationRepository;
            _organizationDocumentRepository = organizationDocumentRepository;
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
                        o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.OrganizationDeclinationIntervalInDays))
                        .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OrganizationDeclinationBatchSize).ToList();
                    if (items.Count == 0) break;

                    var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

                    foreach (var item in items)
                    {
                        item.CommentApproval = $"Auto-Declined due to being {string.Join("/", Statuses_Declination).ToLower()} for more than {_scheduleJobOptions.OrganizationDeclinationIntervalInDays} days";
                        item.StatusId = statusDeclinedId;
                        item.ModifiedByUserId = user.Id;
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
                            new() { Email = group.Key.Email, DisplayName = group.Key.DisplayName }
                        };

                            var data = new EmailOrganizationApproval { Organizations = new List<EmailOrganizationApprovalItem>() };
                            foreach (var org in group)
                            {
                                data.Organizations.Add(new EmailOrganizationApprovalItem
                                {
                                    Name = org.Name,
                                    Comment = org.CommentApproval,
                                    URL = _emailURLFactory.OrganizationApprovalItemURL(emailType, org.Id)
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
                        o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.OrganizationDeletionIntervalInDays))
                        .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OrganizationDeletionBatchSize).ToList();
                    if (items.Count == 0) break;

                    var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

                    foreach (var item in items)
                    {
                        item.StatusId = statusDeletedId;
                        item.ModifiedByUserId = user.Id;
                        _logger.LogInformation("Organization with id '{id}' flagged for deletion", item.Id);
                    }

                    _organizationRepository.Update(items).Wait();

                } while (true);

                _logger.LogInformation("Processed organization deletion");
            }
        }

        public void SeedLogoAndDocuments()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                if (!_appSettings.TestDataSeedingEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
                {
                    _logger.LogInformation("Organization logo and document seeding skipped for environment '{environment}'", _environmentProvider.Environment);
                    return;
                }

                _logger.LogInformation("Processing organization logo and document seeding");

                SeedLogo();
                SeedDocuments();

                _logger.LogInformation("Processed organization logo and document seeding");
            }
        }
        #endregion

        #region Private Members
        private void SeedLogo()
        {
            var items = _organizationRepository.Query(true).Where(o => !o.LogoId.HasValue).ToList();
            if (items.Count == 0) return;

            var resourcePath = "Yoma.Core.Domain.Entity.SampleBlobs.sample_logo.png";
            var assembly = Assembly.GetExecutingAssembly();
            using var resourceStream = assembly.GetManifestResourceStream(resourcePath)
                ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found");

            byte[] resourceBytes;
            using (var memoryStream = new MemoryStream())
            {
                resourceStream.CopyTo(memoryStream);
                resourceBytes = memoryStream.ToArray();
            }

            var fileName = string.Join('.', resourcePath.Split('.').Reverse().Take(2).Reverse());
            var fileExtension = Path.GetExtension(fileName)[1..];

            foreach (var item in items)
                _organizationService.UpdateLogo(item.Id, FileHelper.FromByteArray(fileName, $"image/{fileExtension}", resourceBytes), false).Wait();
        }

        private void SeedDocuments()
        {
            var items = _organizationRepository.Query(true).Where(o => !_organizationDocumentRepository.Query().Any(od => od.OrganizationId == o.Id)).ToList();
            if (items.Count == 0) return;

            var myItemsEducation = items.Where(
                o => o.ProviderTypes != null
                && o.ProviderTypes.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null).ToList();

            var myItemsMarketplace = items.Where(
                o => o.ProviderTypes != null
                && o.ProviderTypes.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null).ToList();

            var resourcePath = "Yoma.Core.Domain.Entity.SampleBlobs.sample.pdf";
            var assembly = Assembly.GetExecutingAssembly();
            using var resourceStream = assembly.GetManifestResourceStream(resourcePath)
                ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found");

            byte[] resourceBytes;
            using (var memoryStream = new MemoryStream())
            {
                resourceStream.CopyTo(memoryStream);
                resourceBytes = memoryStream.ToArray();
            }

            var fileName = string.Join('.', resourcePath.Split('.').Reverse().Take(2).Reverse());
            var fileExtension = Path.GetExtension(fileName)[1..];

            foreach (var item in items)
                _organizationService.AddDocuments(
                    item.Id, OrganizationDocumentType.Registration,
                    new List<IFormFile> { FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes) }, false).Wait();

            foreach (var item in myItemsEducation)
                _organizationService.AddDocuments(
                    item.Id, OrganizationDocumentType.EducationProvider,
                    new List<IFormFile> { FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes) }, false).Wait();

            foreach (var item in myItemsMarketplace)
                _organizationService.AddDocuments(
                    item.Id, OrganizationDocumentType.Business,
                    new List<IFormFile> { FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes) }, false).Wait();
        }
        #endregion
    }
}
