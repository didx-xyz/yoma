using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSIBackgroundService : ISSIBackgroundService
    {
        #region Class Variables
        private readonly ILogger<SSIBackgroundService> _logger;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly IUserService _userService;
        private readonly IOrganizationService _organizationService;
        private readonly ISSICredentialService _ssiCredentialService;

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public SSIBackgroundService(ILogger<SSIBackgroundService> logger,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            ISSIProviderClientFactory ssiProviderClientFactory,
            IUserService userService,
            IOrganizationService organizationService,
            ISSICredentialService ssiCredentialService)
        {
            _logger = logger;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _userService = userService;
            _organizationService = organizationService;
            _ssiCredentialService = ssiCredentialService;
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

        public void ProcessCredentialIssuance()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing SSI credential issuance");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);

                ProcessCredentialIssuanceMyOpportunity(executeUntil);

                _logger.LogInformation("Processed SSI credential issuance");
            }
        }
        #endregion

        #region Private Members
        private void ProcessCredentialIssuanceMyOpportunity(DateTime executeUntil)
        {
            while (executeUntil > DateTime.Now)
            {
                var items = _ssiCredentialService.ListPendingIssuanceMyOpportunity(_scheduleJobOptions.SSICredentialIssuanceScheduleBatchSize);
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    try
                    {
                        _logger.LogInformation("Processing SSI credential issuance for 'my' opportunity with id '{id}'", item.Id);

                        //_ssiCredentialService.Issue(item).Wait();

                        _logger.LogInformation("Processed SSI credential issuance for 'my' opportunity with id '{id}'", item.Id);

                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to issue SSI credential for 'my' opportunity with id '{id}'", item.Id);
                    }

                    if (executeUntil <= DateTime.Now) break;
                }
            }
        }

        private void ProcessTenantCreationUser(DateTime executeUntil)
        {
            while (executeUntil > DateTime.Now)
            {
                var items = _userService.ListPendingSSITenantCreation(_scheduleJobOptions.SSITenantCreationScheduleBatchSize);
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
                        _userService.UpdateSSITenantReference(item.Id, tenantId).Wait();

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
                var items = _organizationService.ListPendingSSITenantCreation(_scheduleJobOptions.SSITenantCreationScheduleBatchSize);
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
                        _organizationService.UpdateSSITenantReference(item.Id, tenantId).Wait();

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
