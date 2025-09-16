using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using tusdotnet;
using tusdotnet.Models;
using tusdotnet.Models.Configuration;
using tusdotnet.Models.Expiration;
using tusdotnet.Stores.S3;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Infrastructure.AmazonS3.Client;
using Yoma.Core.Infrastructure.AmazonS3.Models;
using Yoma.Core.Infrastructure.AmazonS3.Services;

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

    public static void AddResumableUploadStore(
      this IServiceCollection services,
      Domain.Core.Environment environment)
    {
      services.AddSingleton(sp =>
      {
        var logger = sp.GetRequiredService<ILogger<TusS3Store>>();
        var opts = sp.GetRequiredService<IOptions<AWSS3Options>>().Value ?? throw new InvalidOperationException($"Missing {AWSS3Options.Section}");

        using var scope = sp.CreateScope();
        var factory = scope.ServiceProvider.GetRequiredService<IBlobProviderClientFactory>();

        var wrapperBase = factory.CreateClient(StorageType.Private);
        if (wrapperBase is not AmazonS3Client wrapper)
          throw new InvalidOperationException($"Expected {nameof(IBlobProviderClient)} of type {nameof(AmazonS3Client)}");

        var root = $"{environment}/{opts.Tus.KeyPrefix}".ToLower();
        var filePrefix = $"{root}/files/";
        var infoPrefix = $"{root}/upload-info/";

        var storeCfg = new TusS3StoreConfiguration
        {
          BucketName = wrapper.AWSS3OptionsBucket.BucketName,
          FileObjectPrefix = filePrefix,
          UploadInfoObjectPrefix = infoPrefix
        };

        return new TusS3Store(logger, storeCfg, s3Client: wrapper.NativeClient);
      });

      services.AddScoped<IResumableUploadStore, TusResumableUploadStoreService>();
    }

    public static IEndpointConventionBuilder MapResumableUploadEndpoints(
      this IEndpointRouteBuilder endpoints,
      IConfiguration configuration,
      string authPolicy)
    {
      var options = configuration.GetSection(AWSS3Options.Section).Get<AWSS3Options>()
                   ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{AWSS3Options.Section}'");

      var builder = endpoints.MapTus(
        options.Tus.UrlPath,
        httpContext =>
        {
          var tusStore = httpContext.RequestServices.GetRequiredService<TusS3Store>();

          var cfg = new DefaultTusConfiguration
          {
            Store = tusStore,
            MetadataParsingStrategy = options.Tus.AllowEmptyMetadata
              ? MetadataParsingStrategy.AllowEmptyValues
              : MetadataParsingStrategy.Original,
            Expiration = new SlidingExpiration(TimeSpan.FromMinutes(options.Tus.ExpirationMinutes)),
            UsePipelinesIfAvailable = options.Tus.UsePipelinesIfAvailable,
            Events = new Events()
          };

          return Task.FromResult(cfg);
        });

      builder.RequireAuthorization(authPolicy);
      return builder;
    }
  }
}
