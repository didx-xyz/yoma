using FluentValidation;
using Hangfire;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Services.Lookups;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Services;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Services.Lookups;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity.Services.Lookups;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Services;
using Yoma.Core.Domain.SSI.Services.Lookups;

namespace Yoma.Core.Domain
{
    public static class Startup
    {
        #region Public Members
        public static void ConfigureServices_DomainServices(this IServiceCollection services)
        {
            //register all validators in Yoma.Core.Domain assembly
            services.AddValidatorsFromAssemblyContaining<UserService>();

            #region Core
            services.AddScoped<IBlobService, BlobService>();
            #endregion Core

            #region Entity
            #region Lookups
            services.AddScoped<IOrganizationStatusService, OrganizationStatusService>();
            services.AddScoped<IOrganizationProviderTypeService, OrganizationProviderTypeService>();
            #endregion Lookups

            services.AddScoped<IOrganizationService, OrganizationService>();
            services.AddScoped<IOrganizationBackgroundService, OrganizationBackgroundService>();
            services.AddScoped<IUserProfileService, UserProfileService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IUserBackgroundService, UserBackgroundService>();
            #endregion Entity

            #region Lookups
            services.AddScoped<ICountryService, CountryService>();
            services.AddScoped<IGenderService, GenderService>();
            services.AddScoped<ILanguageService, LanguageService>();
            services.AddScoped<ISkillService, SkillService>();
            services.AddScoped<ITimeIntervalService, TimeIntervalService>();
            #endregion Lookups

            #region My Opportunity
            #region Lookups
            services.AddScoped<IMyOpportunityActionService, MyOpportunityActionService>();
            services.AddScoped<IMyOpportunityVerificationStatusService, MyOpportunityVerificationStatusService>();
            #endregion Lookups

            services.AddScoped<IMyOpportunityService, MyOpportunityService>();
            services.AddScoped<IMyOpportunityBackgroundService, MyOpportunityBackgroundService>();
            #endregion My Opportunity

            #region Opportunity
            #region Lookups
            services.AddScoped<IOpportunityCategoryService, OpportunityCategoryService>();
            services.AddScoped<IOpportunityDifficultyService, OpportunityDifficultyService>();
            services.AddScoped<IOpportunityStatusService, OpportunityStatusService>();
            services.AddScoped<IOpportunityTypeService, OpportunityTypeService>();
            services.AddScoped<IOpportunityVerificationTypeService, OpportunityVerificationTypeService>();
            #endregion Lookups

            services.AddScoped<IOpportunityService, OpportunityService>();
            services.AddScoped<IOpportunityInfoService, OpportunityInfoService>();
            services.AddScoped<IOpportunityBackgroundService, OpportunityBackgroundService>();
            #endregion Opportunity

            #region SSI
            #region Lookups
            services.AddScoped<ISSICredentialIssuanceStatusService, SSICredentialIssuanceStatusService>();
            services.AddScoped<ISSISchemaEntityService, SSISchemaEntityService>();
            services.AddScoped<ISSISchemaTypeService, SSISchemaTypeService>();
            services.AddScoped<ISSITenantCreationStatusService, SSITenantCreationStatusService>();
            #endregion Lookups

            services.AddScoped<ISSIBackgroundService, SSIBackgroundService>();
            services.AddScoped<ISSICredentialService, SSICredentialService>();
            services.AddScoped<ISSISchemaService, SSISchemaService>();
            services.AddScoped<ISSITenantService, SSITenantService>();
            services.AddScoped<ISSIWalletService, SSIWalletService>();
            #endregion SSI
        }

        public static void Configure_RecurringJobs(this IServiceProvider serviceProvider, IConfiguration configuration, Core.Environment environment)
        {
            var options = configuration.GetSection(ScheduleJobOptions.Section).Get<ScheduleJobOptions>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{ScheduleJobOptions.Section}'");

            using var scope = serviceProvider.CreateScope();

            var scheduledJobs = JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, int.MaxValue);
            foreach (var job in scheduledJobs) BackgroundJob.Delete(job.Key);

            //skills
            var skillService = scope.ServiceProvider.GetRequiredService<ISkillService>();

            BackgroundJob.Enqueue(() => skillService.SeedSkills()); //execute on startup
            RecurringJob.AddOrUpdate("Skill Reference Seeding", () => skillService.SeedSkills(), options.SeedSkillsSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //opportunity
            var opportunityBackgroundService = scope.ServiceProvider.GetRequiredService<IOpportunityBackgroundService>();
            RecurringJob.AddOrUpdate($"Opportunity Expiration ({Status.Active} or {Status.Inactive} that has ended)",
                () => opportunityBackgroundService.ProcessExpiration(), options.OpportunityExpirationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate($"Opportunity Expiration Notifications ({Status.Active} or {Status.Inactive} ending within {options.OpportunityExpirationNotificationIntervalInDays} days)",
                () => opportunityBackgroundService.ProcessExpirationNotifications(), options.OpportunityExpirationNotificationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate($"Opportunity Deletion ({Status.Inactive} or {Status.Expired} for more than {options.OpportunityDeletionIntervalInDays} days)",
                () => opportunityBackgroundService.ProcessDeletion(), options.OpportunityDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //my opportunity
            var myOpportunityBackgroundService = scope.ServiceProvider.GetRequiredService<IMyOpportunityBackgroundService>();
            RecurringJob.AddOrUpdate($"'My' Opportunity Verification Rejection ({VerificationStatus.Pending} for more than {options.MyOpportunityRejectionIntervalInDays} days)",
               () => myOpportunityBackgroundService.ProcessVerificationRejection(), options.MyOpportunityRejectionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //organization
            var organizationBackgroundService = scope.ServiceProvider.GetRequiredService<IOrganizationBackgroundService>();
            RecurringJob.AddOrUpdate($"Organization Declination ({OrganizationStatus.Inactive} for more than {options.OrganizationDeclinationIntervalInDays} days)",
               () => organizationBackgroundService.ProcessDeclination(), options.OrganizationDeclinationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate($"Organization Deletion ({OrganizationStatus.Declined} for more than {options.OrganizationDeletionIntervalInDays} days)",
               () => organizationBackgroundService.ProcessDeletion(), options.OrganizationDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //ssi
            var ssiTenantBackgroundService = scope.ServiceProvider.GetRequiredService<ISSIBackgroundService>();
            BackgroundJob.Enqueue(() => ssiTenantBackgroundService.SeedSchemas()); //seed default schemas
            RecurringJob.AddOrUpdate($"SSI Tenant Creation",
               () => ssiTenantBackgroundService.ProcessTenantCreation(), options.SSITenantCreationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate($"SSI Credential Issuance",
               () => ssiTenantBackgroundService.ProcessCredentialIssuance(), options.SSICredentialIssuanceSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //seeding (local and development)
            switch (environment)
            {
                case Core.Environment.Local:
                case Core.Environment.Development:
                case Core.Environment.Staging: //TODO: Remove this when we have a proper staging environment (seeded for demo purposes)
                    //organization
                    BackgroundJob.Schedule(() => organizationBackgroundService.SeedLogoAndDocuments(), TimeSpan.FromMinutes(5));

                    //user
                    var userBackgroundService = scope.ServiceProvider.GetRequiredService<IUserBackgroundService>();
                    BackgroundJob.Schedule(() => userBackgroundService.SeedPhotos(), TimeSpan.FromMinutes(5));

                    //my opportunity verifications
                    BackgroundJob.Schedule(() => myOpportunityBackgroundService.SeedPendingVerifications(), TimeSpan.FromMinutes(5));
                    break;
            }
        }
        #endregion
    }
}
