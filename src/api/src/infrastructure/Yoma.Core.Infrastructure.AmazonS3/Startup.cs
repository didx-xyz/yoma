using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Infrastructure.AmazonS3.Client;
using Yoma.Core.Infrastructure.AmazonS3.Models;

namespace Yoma.Core.Infrastructure.AmazonS3
{
    public static class Startup
    {
        public static void ConfigureServices_BlobProvider(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<AWSS3Options>(options => configuration.GetSection(AWSS3Options.Section).Bind(options));
        }

        public static void ConfigureServices_InfrastructureBlobProvider(this IServiceCollection services)
        {
            services.AddScoped<IBlobProviderClientFactory, AmazonS3ClientFactory>();
        }
    }
}
