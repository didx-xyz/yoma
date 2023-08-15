using Amazon;
using Amazon.Extensions.NETCore.Setup;
using Amazon.Runtime;
using Amazon.S3;
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

    public static void ConfigureService_InfrastructureBlobProvider(this IServiceCollection services, IConfiguration configuration)
    {
      var options = configuration.GetSection(AWSS3Options.Section).Get<AWSS3Options>()
          ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{AWSS3Options.Section}'");

      var optionsAWS = new AWSOptions
      {
        Region = RegionEndpoint.GetBySystemName(options.Region),
        Credentials = new BasicAWSCredentials(options.AccessKey, options.SecretKey)
      };

      services.AddAWSService<IAmazonS3>(optionsAWS);
      services.AddScoped<IBlobProviderClientFactory, AmazonS3ClientFactory>();
    }
  }
}
