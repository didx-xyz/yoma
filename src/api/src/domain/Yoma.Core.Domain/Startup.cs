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

        public static void Configure_RecurringJobs(this IConfiguration configuration, Core.Environment environment)
        {
            var appSettings = configuration.GetSection(AppSettings.Section).Get<AppSettings>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{AppSettings.Section}'");
            var options = configuration.GetSection(ScheduleJobOptions.Section).Get<ScheduleJobOptions>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{ScheduleJobOptions.Section}'");

            var scheduledJobs = JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, int.MaxValue);
            foreach (var job in scheduledJobs) BackgroundJob.Delete(job.Key);

            //skills
            BackgroundJob.Enqueue<ISkillService>(s => s.SeedSkills()); //execute on startup
            RecurringJob.AddOrUpdate<ISkillService>("Skill Reference Seeding", s => s.SeedSkills(), options.SeedSkillsSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //opportunity
            RecurringJob.AddOrUpdate<IOpportunityBackgroundService>($"Opportunity Expiration ({Status.Active} or {Status.Inactive} that has ended)",
                s => s.ProcessExpiration(), options.OpportunityExpirationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate<IOpportunityBackgroundService>($"Opportunity Expiration Notifications ({Status.Active} or {Status.Inactive} ending within {options.OpportunityExpirationNotificationIntervalInDays} days)",
                s => s.ProcessExpirationNotifications(), options.OpportunityExpirationNotificationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate<IOpportunityBackgroundService>($"Opportunity Deletion ({Status.Inactive} or {Status.Expired} for more than {options.OpportunityDeletionIntervalInDays} days)",
                s => s.ProcessDeletion(), options.OpportunityDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //my opportunity
            RecurringJob.AddOrUpdate<IMyOpportunityBackgroundService>($"'My' Opportunity Verification Rejection ({VerificationStatus.Pending} for more than {options.MyOpportunityRejectionIntervalInDays} days)",
               s => s.ProcessVerificationRejection(), options.MyOpportunityRejectionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //organization
            RecurringJob.AddOrUpdate<IOrganizationBackgroundService>($"Organization Declination ({OrganizationStatus.Inactive} for more than {options.OrganizationDeclinationIntervalInDays} days)",
               s => s.ProcessDeclination(), options.OrganizationDeclinationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate<IOrganizationBackgroundService>($"Organization Deletion ({OrganizationStatus.Declined} for more than {options.OrganizationDeletionIntervalInDays} days)",
               s => s.ProcessDeletion(), options.OrganizationDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //ssi
            BackgroundJob.Enqueue<ISSIBackgroundService>(s => s.SeedSchemas()); //seed default schemas
            RecurringJob.AddOrUpdate<ISSIBackgroundService>($"SSI Tenant Creation",
               s => s.ProcessTenantCreation(), options.SSITenantCreationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate<ISSIBackgroundService>($"SSI Credential Issuance",
               s => s.ProcessCredentialIssuance(), options.SSICredentialIssuanceSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            //seeding of test data
            if (!appSettings.TestDataSeedingEnvironmentsAsEnum.HasFlag(environment)) return;

            //organization
            BackgroundJob.Schedule<IOrganizationBackgroundService>(s => s.SeedLogoAndDocuments(), TimeSpan.FromMinutes(appSettings.TestDataSeedingDelayInMinutes));

            //user
            BackgroundJob.Schedule<IUserBackgroundService>(s => s.SeedPhotos(), TimeSpan.FromMinutes(appSettings.TestDataSeedingDelayInMinutes));

            //my opportunity verifications
            BackgroundJob.Schedule<IMyOpportunityBackgroundService>(s => s.SeedPendingVerifications(), TimeSpan.FromMinutes(appSettings.TestDataSeedingDelayInMinutes));
        }
        #endregion
    }
}
