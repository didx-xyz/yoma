using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.ActionLink.Models.Lookups;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.ActionLink.Repositories;
using Yoma.Core.Infrastructure.Database.ActionLink.Repositories.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Core.Services;
using Yoma.Core.Infrastructure.Database.Entity.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Repositories;
using Yoma.Core.Infrastructure.Database.Marketplace.Repositories;
using Yoma.Core.Infrastructure.Database.Marketplace.Repositories.Lookup;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;
using Yoma.Core.Infrastructure.Database.Reward.Repositories;
using Yoma.Core.Infrastructure.Database.Reward.Repositories.Lookup;
using Yoma.Core.Infrastructure.Database.SSI.Repositories;
using Yoma.Core.Infrastructure.Database.SSI.Repositories.Lookups;

namespace Yoma.Core.Infrastructure.Database
{
  public static class Startup
  {
    private const string ConnectionStrings_SQLConnection = "SQLConnection";

    #region Public Members
    public static string Configuration_ConnectionString(this IConfiguration configuration)
    {
      var result = configuration.GetConnectionString(ConnectionStrings_SQLConnection);
      if (string.IsNullOrEmpty(result))
        throw new InvalidOperationException($"Failed to retrieve configuration section 'ConnectionStrings.{ConnectionStrings_SQLConnection}'");

      return result;
    }

    public static void ConfigureServices_InfrastructureDatabase(this IServiceCollection services, IConfiguration configuration, AppSettings appSettings)
    {
      // infrastructure
      services.AddDbContext<ApplicationDbContext>(options =>
      {
        options.UseNpgsql(configuration.Configuration_ConnectionString(), npgsqlOptions =>
              {
                npgsqlOptions.EnableRetryOnFailure(
                          maxRetryCount: appSettings.DatabaseRetryPolicy.MaxRetryCount,
                          maxRetryDelay: TimeSpan.FromSeconds(appSettings.DatabaseRetryPolicy.MaxRetryDelayInSeconds),
                          errorCodesToAdd: null);
              })
        //disable warning related to not using AsSplitQuery() as per MS SQL implementation
        //.UseLazyLoadingProxies(): without arguments is used to enable lazy loading. Simply not calling UseLazyLoadingProxies() ensure lazy loading is not enabled
        .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.MultipleCollectionIncludeWarning));

      }, ServiceLifetime.Scoped, ServiceLifetime.Scoped);

      services.AddHealthChecks().AddNpgSql(
        connectionString: configuration.Configuration_ConnectionString(),
        name: "Database Connectivity Check",
        tags: ["live"]);

      //<PackageReference Include="EntityFrameworkProfiler.Appender" Version="6.0.6040" />
      //if (environment == Domain.Core.Environment.Local)
      //    HibernatingRhinos.Profiler.Appender.EntityFramework.EntityFrameworkProfiler.Initialize();

      // repositories
      #region ActionLink
      #region Lookups
      services.AddScoped<IRepository<LinkStatus>, LinkStatusRepository>();
      #endregion Lookups
      services.AddScoped<IRepositoryBatched<Link>, LinkRepository>();
      services.AddScoped<IRepository<LinkUsageLog>, LinkUsageLogRepository>();
      #endregion ActionLink

      #region Core
      services.AddScoped<IExecutionStrategyService, ExecutionStrategyService>();
      services.AddScoped<IRepository<BlobObject>, BlobObjectRepository>();
      #endregion Core

      #region Entity
      #region Lookups
      services.AddScoped<IRepository<Domain.Entity.Models.Lookups.OrganizationStatus>, Entity.Repositories.Lookups.OrganizationStatusRepository>();
      services.AddScoped<IRepository<Domain.Entity.Models.Lookups.OrganizationProviderType>, Entity.Repositories.Lookups.OrganizationProviderTypeRepository>();
      #endregion Lookups
      services.AddScoped<IRepository<OrganizationDocument>, OrganizationDocumentRepository>();
      services.AddScoped<IRepository<OrganizationProviderType>, OrganizationProviderTypeRepository>();
      services.AddScoped<IRepositoryBatchedValueContainsWithNavigation<Organization>, OrganizationRepository>();
      services.AddScoped<IRepository<OrganizationUser>, OrganizationUserRepository>();
      services.AddScoped<IRepositoryValueContainsWithNavigation<User>, UserRepository>();
      services.AddScoped<IRepository<UserLoginHistory>, UserLoginHistoryRepository>();
      services.AddScoped<IRepository<UserSkill>, UserSkillRepository>();
      services.AddScoped<IRepository<UserSkillOrganization>, UserSkillOrganizationRepository>();
      #endregion Entity

      #region Lookups
      services.AddScoped<IRepository<Country>, CountryRepository>();
      services.AddScoped<IRepository<Education>, EducationRepository>();
      services.AddScoped<IRepository<EngagementType>, EngagementTypeRepository>();
      services.AddScoped<IRepository<Gender>, GenderRepository>();
      services.AddScoped<IRepository<Language>, LanguageRepository>();
      services.AddScoped<IRepositoryBatchedValueContains<Skill>, SkillRepository>();
      services.AddScoped<IRepository<TimeInterval>, TimeIntervalRepository>();
      #endregion Lookups

      #region Marketplace
      #region Lookups
      services.AddScoped<IRepository<Domain.Marketplace.Models.Lookups.TransactionStatus>, TransactionStatusRepository>();
      #endregion Lookups

      services.AddScoped<IRepository<Domain.Marketplace.Models.TransactionLog>, TransactionLogRepository>();
      #endregion Marketplace

      #region MyOpportunity
      #region Lookups
      services.AddScoped<IRepository<Domain.MyOpportunity.Models.Lookups.MyOpportunityAction>, MyOpportunity.Repositories.Lookups.MyOpportunityActionRepository>();
      services.AddScoped<IRepository<Domain.MyOpportunity.Models.Lookups.MyOpportunityVerificationStatus>, MyOpportunity.Repositories.Lookups.MyOpportunityVerificationStatusRepository>();
      #endregion Lookups

      services.AddScoped<IRepositoryBatchedWithNavigation<Domain.MyOpportunity.Models.MyOpportunity>, MyOpportunityRepository>();
      services.AddScoped<IRepository<Domain.MyOpportunity.Models.MyOpportunityVerification>, MyOpportunityVerificationRepository>();
      #endregion MyOpportunity

      #region Opportunity
      #region Lookups
      services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityCategory>, Opportunity.Repositories.Lookups.OpportunityCategoryRepository>();
      services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityDifficulty>, Opportunity.Repositories.Lookups.OpportunityDifficultyRepository>();
      services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityStatus>, Opportunity.Repositories.Lookups.OpportunityStatusRepository>();
      services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityType>, Opportunity.Repositories.Lookups.OpportunityTypeRepository>();
      services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityVerificationType>, Opportunity.Repositories.Lookups.OpportunityVerificationTypeRepository>();
      #endregion Lookups

      services.AddScoped<IRepositoryBatchedValueContainsWithNavigation<Domain.Opportunity.Models.Opportunity>, OpportunityRepository>();
      services.AddScoped<IRepository<OpportunityCategory>, OpportunityCategoryRepository>();
      services.AddScoped<IRepository<OpportunityCountry>, OpportunityCountryRepository>();
      services.AddScoped<IRepository<OpportunityLanguage>, OpportunityLanguageRepository>();
      services.AddScoped<IRepository<OpportunitySkill>, OpportunitySkillRepository>();
      services.AddScoped<IRepository<OpportunityVerificationType>, OpportunityVerificationTypeRepository>();
      #endregion Opportunity

      #region PartnerSharing
      #region Lookups
      services.AddScoped<IRepository<Domain.PartnerSharing.Models.Lookups.Partner>, PartnerSharing.Repositories.Lookups.PartnerRepository>();
      services.AddScoped<IRepository<Domain.PartnerSharing.Models.Lookups.ProcessingStatus>, PartnerSharing.Repositories.Lookups.ProcessingStatusRepository>();
      #endregion Lookups

      services.AddScoped<IRepository<Domain.PartnerSharing.Models.ProcessingLog>, PartnerSharing.Repositories.ProcessingLogRepository>();
      #endregion PartnerSharing

      #region Reward
      #region Lookups
      services.AddScoped<IRepository<Domain.Reward.Models.Lookups.RewardTransactionStatus>, RewardTransactionStatusRepository>();

      services.AddScoped<IRepository<Domain.Reward.Models.Lookups.WalletCreationStatus>, WalletCreationStatusRepository>();
      #endregion Lookups

      services.AddScoped<IRepositoryBatched<Domain.Reward.Models.RewardTransaction>, RewardTransactionRepository>();

      services.AddScoped<IRepository<Domain.Reward.Models.WalletCreation>, WalletCreationRepository>();
      #endregion Reward

      #region SSI
      #region Lookups
      services.AddScoped<IRepository<SSICredentialIssuanceStatus>, SSICredentialIssuanceStatusRepository>();
      services.AddScoped<IRepositoryWithNavigation<SSISchemaEntity>, SSISchemaEntityRepository>();
      services.AddScoped<IRepository<SSISchemaType>, SSISchemaTypeRepository>();
      services.AddScoped<IRepository<SSITenantCreationStatus>, SSITenantCreationStatusRepository>();
      #endregion Lookups

      services.AddScoped<IRepository<SSICredentialIssuance>, SSICredentialIssuanceRepository>();
      services.AddScoped<IRepository<SSITenantCreation>, SSITenantCreationRepository>();
      #endregion SSI
    }

    public static void Configure_InfrastructureDatabase(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      var logger = scope.ServiceProvider.GetService<ILogger<ApplicationDbContext>>() ?? throw new InvalidOperationException($"Failed to get an instance of the service '{nameof(ILogger<ApplicationDbContext>)}'");
      logger.LogDebug("Applying database migrations...");

      var context = scope.ServiceProvider.GetService<ApplicationDbContext>() ?? throw new InvalidOperationException($"Failed to get an instance of the service '{nameof(ILogger<ApplicationDbContext>)}'");

      // migrate db
      context.Database.Migrate();
    }
    #endregion
  }
}
