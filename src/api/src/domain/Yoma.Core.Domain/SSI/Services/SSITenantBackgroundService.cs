using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSITenantBackgroundService : ISSITenantBackgroundService
    {
        #region Class Variables
        private readonly ILogger<SSITenantBackgroundService> _logger;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly ISSIProviderClient _ssiProviderClient;

        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
        private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public SSITenantBackgroundService(ILogger<SSITenantBackgroundService> logger,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            ISSIProviderClientFactory ssiProviderClientFactory,
            IOrganizationStatusService organizationStatusService,
            IRepositoryValueContainsWithNavigation<User> userRepository,
            IRepositoryBatchedValueContainsWithNavigation<Organization> organizationRepository)
        {
            _logger = logger;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _organizationStatusService = organizationStatusService;
            _userRepository = userRepository;
            _organizationRepository = organizationRepository;
        }
        #endregion

        #region Public Members
        public void ProcessTenantCreation()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing SSI tenant creation");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);

                ProcessTenantCreationUser(executeUntil);
                ProcessTenantCreationOrganization(executeUntil);

                _logger.LogInformation("Processed SSI tenant creation");
            }
        }
        #endregion

        #region Private Members
        private void ProcessTenantCreationUser(DateTime executeUntil)
        {
            while (executeUntil > DateTime.Now)
            {
                var items = _userRepository.Query().Where(o => !o.DateSSITenantCreated.HasValue && o.YoIDOnboarded.HasValue && o.YoIDOnboarded.Value)
                       .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.SSITenantCreationScheduleBatchSize).ToList();
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    try
                    {
                        _logger.LogInformation("Processing SSI tenant creation for user with id '{id}'", item.Id);

                        var request = new TenantRequest
                        {
                            Referent = item.Id.ToString(),
                            Name = item.DisplayName,
                            ImageUrl = item.PhotoURL,
                            Roles = new List<Models.Role> { Models.Role.Holder }
                        };

                        var tenantId = _ssiProviderClient.EnsureTenant(request).Result;

                        item.SSITenantId = tenantId;

                        _userRepository.Update(item).Wait();

                        _logger.LogInformation("Processed SSI tenant creation for user with id '{id}'", item.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to created tenant for user with id '{id}'", item.Id);
                    }

                    if (executeUntil <= DateTime.Now) break;
                }
            }
        }

        private void ProcessTenantCreationOrganization(DateTime executeUntil)
        {
            while (executeUntil > DateTime.Now)
            {
                var statusActive = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString());

                var items = _organizationRepository.Query().Where(o => !o.DateSSITenantCreated.HasValue && o.StatusId == statusActive.Id)
                       .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.SSITenantCreationScheduleBatchSize).ToList();
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    try
                    {
                        _logger.LogInformation("Processing SSI tenant creation for organization with id '{id}'", item.Id);

                        var request = new TenantRequest
                        {
                            Referent = item.Id.ToString(),
                            Name = item.Name,
                            ImageUrl = item.LogoURL,
                            Roles = new List<Models.Role> { Models.Role.Issuer, Models.Role.Verifier }
                        };

                        var tenantId = _ssiProviderClient.EnsureTenant(request).Result;

                        item.SSITenantId = tenantId;

                        _organizationRepository.Update(item).Wait();

                        _logger.LogInformation("Processed SSI tenant creation for organization with id '{id}'", item.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to created tenant for organization with id '{id}'", item.Id);
                    }

                    if (executeUntil <= DateTime.Now) break;
                }
            }
        }
        #endregion
    }
}
