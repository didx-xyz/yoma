using FluentValidation;
using Hangfire;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Services.Lookups;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Services;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Services.Lookups;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity.Services.Lookups;

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
            services.AddScoped<IUserService, UserService>();
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
            #endregion My Opportunity

            #region Opportunity
            #region Lookups
            services.AddScoped<IOpportunityCategoryService, OpportunityCategoryService>();
            services.AddScoped<IOpportunityDifficultyService, OpportunityDifficultyService>();
            services.AddScoped<IOpportunityStatusService, OpportunityStatusService>();
            services.AddScoped<IOpportunityTypeService, OpportunityTypeService>();
            #endregion Lookups

            services.AddScoped<IOpportunityService, OpportunityService>();
            services.AddScoped<IOpportunityBackgroundService, OpportunityBackgroundService>();
            #endregion Opportunity
        }

        public static void Configure_RecurringJobs(this IServiceProvider serviceProvider, IConfiguration configuration)
        {
            var options = configuration.GetSection(ScheduleJobOptions.Section).Get<ScheduleJobOptions>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{ScheduleJobOptions.Section}'");

            using var scope = serviceProvider.CreateScope();
            var skillService = scope.ServiceProvider.GetRequiredService<ISkillService>();
            RecurringJob.AddOrUpdate("Skill Reference Seeding", () => skillService.SeedSkills(), options.SeedSkillsSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

            var opportunityBackgroundService = scope.ServiceProvider.GetRequiredService<IOpportunityBackgroundService>();
            RecurringJob.AddOrUpdate("Opportunity Expiration", () => opportunityBackgroundService.ProcessExpiration(), options.OpportunityExpirationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
            RecurringJob.AddOrUpdate($"Opportunity Expiration Notifications (with next {options.OpportunityExpirationNotificationIntervalInDays} days)", () => opportunityBackgroundService.ExpirationNotifications(), options.OpportunityExpirationNotificationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
        }
        #endregion
    }
}
