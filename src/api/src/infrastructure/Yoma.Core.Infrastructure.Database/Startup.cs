using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Repositories;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;
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

        public static void ConfigureServices_InfrastructureDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            // infrastructure
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString(ConnectionStrings_SQLConnection)), ServiceLifetime.Scoped, ServiceLifetime.Scoped);

            // repositories
            #region Core
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
            services.AddScoped<IRepository<UserSkill>, UserSkillRepository>();
            #endregion Entity

            #region Lookups
            services.AddScoped<IRepository<Country>, CountryRepository>();
            services.AddScoped<IRepository<Gender>, GenderRepository>();
            services.AddScoped<IRepository<Language>, LanguageRepository>();
            services.AddScoped<IRepositoryBatchedValueContains<Skill>, SkillRepository>();
            services.AddScoped<IRepository<TimeInterval>, TimeIntervalRepository>();
            #endregion Lookups

            #region My Opportunity
            #region Lookups
            services.AddScoped<IRepository<Domain.MyOpportunity.Models.Lookups.MyOpportunityAction>, MyOpportunity.Repositories.Lookups.MyOpportunityActionRepository>();
            services.AddScoped<IRepository<Domain.MyOpportunity.Models.Lookups.MyOpportunityVerificationStatus>, MyOpportunity.Repositories.Lookups.MyOpportunityVerificationStatusRepository>();
            #endregion Lookups

            services.AddScoped<IRepositoryBatchedWithNavigation<Domain.MyOpportunity.Models.MyOpportunity>, MyOpportunityRepository>();
            services.AddScoped<IRepository<Domain.MyOpportunity.Models.MyOpportunityVerification>, MyOpportunityVerificationRepository>();
            #endregion My Opportunity

            #region Opportunity
            #region Lookups
            services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityCategory>, Opportunity.Repositories.Lookups.OpportunityCategoryRepository>();
            services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityDifficulty>, Opportunity.Repositories.Lookups.OpportunityDifficultyRepository>();
            services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityStatus>, Opportunity.Repositories.Lookups.OpportunityStatusRepository>();
            services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityType>, Opportunity.Repositories.Lookups.OpportunityTypeRepository>();
            services.AddScoped<IRepository<Domain.Opportunity.Models.Lookups.OpportunityVerificationType>, Opportunity.Repositories.Lookups.OpportunityVerificationTypeRepository>();
            #endregion

            services.AddScoped<IRepositoryBatchedValueContainsWithNavigation<Domain.Opportunity.Models.Opportunity>, OpportunityRepository>();
            services.AddScoped<IRepository<OpportunityCategory>, OpportunityCategoryRepository>();
            services.AddScoped<IRepository<OpportunityCountry>, OpportunityCountryRepository>();
            services.AddScoped<IRepository<OpportunityLanguage>, OpportunityLanguageRepository>();
            services.AddScoped<IRepository<OpportunitySkill>, OpportunitySkillRepository>();
            services.AddScoped<IRepository<OpportunityVerificationType>, OpportunityVerificationTypeRepository>();
            #endregion

            #region SSI
            #region Lookups
            services.AddScoped<IRepositoryWithNavigation<SSISchemaEntity>, SSISchemaEntityRepository>();
            services.AddScoped<IRepository<SSISchemaType>, SSISchemaTypeRepository>();
            #endregion Lookups

            services.AddScoped<IRepository<Domain.SSI.Models.SSISchemaSchemaType>, SSISchemaSchemaTypeRepository>();
            #endregion
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
