using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Client;
using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.AriesCloud.Models;
using Yoma.Core.Infrastructure.AriesCloud.Repositories;

namespace Yoma.Core.Infrastructure.AriesCloud
{
    public static class Startup
    {
        public static void UseSSIProvider(this IApplicationBuilder applicationBuilder)
        {
            applicationBuilder.ApplicationServices.UseAriesCloudAPI();
        }

        public static void ConfigureServices_InfrastructureSSIProvider(this IServiceCollection services, IConfiguration configuration, string nameOrConnectionString)
        {
            if (string.IsNullOrWhiteSpace(nameOrConnectionString))
                throw new ArgumentNullException(nameof(nameOrConnectionString));
            nameOrConnectionString = nameOrConnectionString.Trim();

            var connectionString = configuration.GetConnectionString(nameOrConnectionString);
            if (string.IsNullOrEmpty(connectionString)) connectionString = nameOrConnectionString;

            services.AddDbContext<AriesCloudDbContext>(options => options.UseSqlServer(connectionString));

            // repositories
            services.AddScoped<IRepository<CredentialSchema>, CredentialSchemaRepository>();
            services.AddScoped<IRepository<Connection>, ConnectionRepository>();

            services.AddAriesCloudAPI();
            services.AddScoped<ISSIProviderClientFactory, AriesCloudClientFactory>();
        }

        public static void Configure_InfrastructureDatabaseSSIProvider(this IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AriesCloudDbContext>();
            dbContext.Database.Migrate();
        }
    }
}
