using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.SSIProvider.Interfaces;
using Yoma.Core.Infrastructure.AriesCloud.Client;
using Yoma.Core.Infrastructure.AriesCloud.Context;

namespace Yoma.Core.Infrastructure.AriesCloud
{
    public static class Startup
    {
        public static void Configure_SSIProvider(this IServiceProvider services)
        {
            services.UseAriesCloudAPI();
        }

        public static void ConfigureServices_InfrastructureSSIProvider(this IServiceCollection services, IConfiguration configuration, string nameOrConnectionString)
        {
            if (string.IsNullOrWhiteSpace(nameOrConnectionString))
                throw new ArgumentNullException(nameof(nameOrConnectionString));
            nameOrConnectionString = nameOrConnectionString.Trim();

            var connectionString = configuration.GetConnectionString(nameOrConnectionString);
            if (string.IsNullOrEmpty(connectionString)) connectionString = nameOrConnectionString;

            services.AddDbContext<AriesCloudDbContext>(options => options.UseSqlServer(connectionString));

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
