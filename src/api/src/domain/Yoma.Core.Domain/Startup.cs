using FluentValidation;
using Hangfire;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.ActionLink.Services;
using Yoma.Core.Domain.ActionLink.Services.Lookups;
using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Analytics.Services;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Services;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Services.Lookups;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Services;
using Yoma.Core.Domain.Marketplace;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;
using Yoma.Core.Domain.Marketplace.Services;
using Yoma.Core.Domain.Marketplace.Services.Lookups;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Services.Lookups;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity.Services.Lookups;
using Yoma.Core.Domain.PartnerSharing;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSharing.Services;
using Yoma.Core.Domain.PartnerSharing.Services.Lookups;
using Yoma.Core.Domain.PartnerSharing.Services.Provider;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Lookups;
using Yoma.Core.Domain.Reward.Services;
using Yoma.Core.Domain.Reward.Services.Lookups;
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

      // add MediatR and register all handlers in the assembly
      services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

      #region ActionLink
      #region Lookups
      services.AddScoped<ILinkStatusService, LinkStatusService>();
      #endregion Lookups

      services.AddScoped<ILinkService, LinkService>();
      services.AddScoped<ILinkServiceBackgroundService, LinkServiceBackgroundService>();
      #endregion ActionLink

      #region Analytics
      services.AddScoped<IAnalyticsService, AnalyticsService>();
      #endregion Analytics

      #region Core
      services.AddScoped<IBlobService, BlobService>();
      services.AddScoped<IDistributedCacheService, DistributedCacheService>();
      services.AddScoped<IDistributedLockService, DistributedLockService>();
      #endregion Core

      #region Entity
      #region Lookups
      services.AddScoped<IOrganizationStatusService, OrganizationStatusService>();
      services.AddScoped<IOrganizationProviderTypeService, OrganizationProviderTypeService>();
      services.AddScoped<ISettingsDefinitionService, SettingsDefinitionService>();
      #endregion Lookups

      services.AddScoped<IOrganizationService, OrganizationService>();
      services.AddScoped<IOrganizationBackgroundService, OrganizationBackgroundService>();
      services.AddScoped<IUserProfileService, UserProfileService>();
      services.AddScoped<IUserService, UserService>();
      services.AddScoped<IUserBackgroundService, UserBackgroundService>();
      #endregion Entity

      #region Lookups
      services.AddScoped<ICountryService, CountryService>();
      services.AddScoped<IEducationService, EducationService>();
      services.AddScoped<IEngagementTypeService, EngagementTypeService>();
      services.AddScoped<IGenderService, GenderService>();
      services.AddScoped<ILanguageService, LanguageService>();
      services.AddScoped<ISkillService, SkillService>();
      services.AddScoped<ITimeIntervalService, TimeIntervalService>();
      #endregion Lookups

      #region Marketplace
      #region Lookups
      services.AddScoped<IStoreAccessControlRuleStatusService, StoreAccessControlRuleStatusService>();
      services.AddScoped<ITransactionStatusService, TransactionStatusService>();
      #endregion Lookups

      services.AddScoped<IStoreAccessControlRuleBackgroundService, StoreAccessControlRuleBackgroundService>();
      services.AddScoped<IStoreAccessControlRuleInfoService, StoreAccessControlRuleInfoService>();
      services.AddScoped<IStoreAccessControlRuleService, StoreAccessControlRuleService>();
      services.AddScoped<IMarketplaceService, MarketplaceService>();
      #endregion Marketplace

      #region My Opportunity
      #region Lookups
      services.AddScoped<IMyOpportunityActionService, MyOpportunityActionService>();
      services.AddScoped<IMyOpportunityVerificationStatusService, MyOpportunityVerificationStatusService>();
      #endregion Lookups

      services.AddScoped<IMyOpportunityService, MyOpportunityService>();
      services.AddScoped<IMyOpportunityBackgroundService, MyOpportunityBackgroundService>();
      #endregion My Opportunity

      #region EmailProvider
      services.AddScoped<INotificationDeliveryService, NotificationDeliveryService>();
      services.AddScoped<INotificationPreferenceFilterService, NotificationPreferenceFilterService>();
      services.AddScoped<INotificationURLFactory, NotificationURLFactory>();
      #endregion EmailProvider

      #region Opportunity
      #region Lookups
      services.AddScoped<IOpportunityCategoryService, OpportunityCategoryService>();
      services.AddScoped<IOpportunityDifficultyService, OpportunityDifficultyService>();
      services.AddScoped<IOpportunityStatusService, OpportunityStatusService>();
      services.AddScoped<IOpportunityTypeService, OpportunityTypeService>();
      services.AddScoped<IOpportunityVerificationTypeService, OpportunityVerificationTypeService>();
      #endregion Lookups

      services.AddScoped<IOpportunityBackgroundService, OpportunityBackgroundService>();
      services.AddScoped<IOpportunityService, OpportunityService>();
      services.AddScoped<IOpportunityInfoService, OpportunityInfoService>();
      #endregion Opportunity

      #region PartnerSharing
      #region Lookups
      services.AddScoped<IPartnerService, PartnerService>();
      services.AddScoped<IProcessingStatusService, ProcessingStatusService>();
      #endregion Lookups

      services.AddScoped<IProcessingLogHelperService, ProcessingLogHelperService>();
      services.AddScoped<ISharingBackgroundService, SharingBackgroundService>();
      services.AddScoped<ISharingInfoService, SharingInfoService>();
      services.AddScoped<ISharingService, SharingService>();
      #endregion PartnerSharing

      #region Reward
      #region Lookups
      services.AddScoped<IRewardTransactionStatusService, RewardTransactionStatusService>();
      services.AddScoped<IWalletCreationStatusService, WalletCreationStatusService>();
      #endregion

      services.AddScoped<IRewardService, RewardService>();
      services.AddScoped<IWalletService, WalletService>();
      services.AddScoped<IRewardBackgrounService, RewardBackgroundService>();
      #endregion Reward

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

    public static void ConfigureServices_DomainServicesCompositionFactory(this IServiceCollection services, Func<IServiceProvider, IDictionary<Partner, ISharingProviderClientFactory>> factoriesResolver)
    {
      services.AddScoped<ISharingProviderClientFactoryPartner>(sp => new SharingProviderClientFactoryPartner(factoriesResolver(sp)));
    }

    public static void Configure_RecurringJobs(this IConfiguration configuration, AppSettings appSettings, Core.Environment environment)
    {
      var options = configuration.GetSection(ScheduleJobOptions.Section).Get<ScheduleJobOptions>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{ScheduleJobOptions.Section}'");

      var scheduledJobs = JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, int.MaxValue);
      foreach (var job in scheduledJobs) BackgroundJob.Delete(job.Key);

      //skills
      BackgroundJob.Enqueue<ISkillService>(s => s.SeedSkills(true)); //execute on startup; seed skills
      RecurringJob.AddOrUpdate<ISkillService>("Skill Reference Seeding", s => s.SeedSkills(false), options.SeedSkillsSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //opportunity
      RecurringJob.AddOrUpdate<IOpportunityBackgroundService>($"Opportunity Published Notifications ({Status.Active} and started in the last {options.OpportunityPublishedNotificationIntervalInDays} days)",
        s => s.ProcessPublishedNotifications(), options.OpportunityPublishedNotificationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<IOpportunityBackgroundService>($"Opportunity Expiration ({Status.Active} that has ended)",
        s => s.ProcessExpiration(), options.OpportunityExpirationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<IOpportunityBackgroundService>($"Opportunity Expiration Notifications ({Status.Active} ending within {options.OpportunityExpirationNotificationIntervalInDays} days)",
        s => s.ProcessExpirationNotifications(), options.OpportunityExpirationNotificationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<IOpportunityBackgroundService>($"Opportunity Deletion ({Status.Inactive} or {Status.Expired} for more than {options.OpportunityDeletionIntervalInDays} days)",
        s => s.ProcessDeletion(), options.OpportunityDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //partner sharing
      RecurringJob.AddOrUpdate<ISharingBackgroundService>($"Partner Sharing Synchronization",
        s => s.ProcessSharing(), options.PartnerSharingSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //my opportunity
      RecurringJob.AddOrUpdate<IMyOpportunityBackgroundService>($"'My' Opportunity Verification Rejection ({VerificationStatus.Pending} for more than {options.MyOpportunityRejectionIntervalInDays} days)",
        s => s.ProcessVerificationRejection(), options.MyOpportunityRejectionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //organization
      RecurringJob.AddOrUpdate<IOrganizationBackgroundService>($"Organization Declination ({OrganizationStatus.Inactive} for more than {options.OrganizationDeclinationIntervalInDays} days)",
        s => s.ProcessDeclination(), options.OrganizationDeclinationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<IOrganizationBackgroundService>($"Organization Deletion ({OrganizationStatus.Declined} for more than {options.OrganizationDeletionIntervalInDays} days)",
        s => s.ProcessDeletion(), options.OrganizationDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //reward
      RecurringJob.AddOrUpdate<IRewardBackgrounService>($"Rewards Wallet Creation",
        s => s.ProcessWalletCreation(), options.RewardWalletCreationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<IRewardBackgrounService>($"Rewards Transaction Processing (awarding rewards)",
        s => s.ProcessRewardTransactions(), options.RewardTransactionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //ssi
      BackgroundJob.Enqueue<ISSIBackgroundService>(s => s.SeedSchemas()); //execute on startup; seed default schemas
      RecurringJob.AddOrUpdate<ISSIBackgroundService>($"SSI Tenant Creation",
        s => s.ProcessTenantCreation(), options.SSITenantCreationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<ISSIBackgroundService>($"SSI Credential Issuance",
        s => s.ProcessCredentialIssuance(), options.SSICredentialIssuanceSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //action link
      RecurringJob.AddOrUpdate<ILinkServiceBackgroundService>($"Action Link Expiration ({LinkStatus.Active} that has ended)",
        s => s.ProcessExpiration(), options.ActionLinkExpirationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<ILinkServiceBackgroundService>($"Action Link Declination ({LinkStatus.Inactive} for more than {options.ActionLinkDeclinationScheduleIntervalInDays} days)",
        s => s.ProcessDeclination(), options.ActionLinkDeclinationSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
      RecurringJob.AddOrUpdate<ILinkServiceBackgroundService>($"Action Link Deletion ({LinkStatus.Declined} for more than {options.ActionLinkDeletionScheduleIntervalInDays} days)",
        s => s.ProcessDeletion(), options.ActionLinkDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //store access control rule
      RecurringJob.AddOrUpdate<IStoreAccessControlRuleBackgroundService>($"Store Access Control Rule Deletion ({StoreAccessControlRuleStatus.Inactive} for more than {options.StoreAccessControlRuleDeletionScheduleIntervalInDays} days)",
        s => s.ProcessDeletion(), options.StoreAccessControlRuleDeletionSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

      //seeding of test data
      if (!appSettings.TestDataSeedingEnvironmentsAsEnum.HasFlag(environment)) return;

      //user
      BackgroundJob.Schedule<IUserBackgroundService>(s => s.SeedPhotos(), TimeSpan.FromMinutes(appSettings.TestDataSeedingDelayInMinutes));

      //organization
      BackgroundJob.Schedule<IOrganizationBackgroundService>(s => s.SeedLogoAndDocuments(), TimeSpan.FromMinutes(appSettings.TestDataSeedingDelayInMinutes + 1));

      //my opportunity verifications
      BackgroundJob.Schedule<IMyOpportunityBackgroundService>(s => s.SeedPendingVerifications(), TimeSpan.FromMinutes(appSettings.TestDataSeedingDelayInMinutes + 2));
    }
    #endregion
  }
}
