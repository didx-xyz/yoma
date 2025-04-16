using Hangfire;
using Hangfire.Dashboard.BasicAuthorization;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Converters;
using StackExchange.Redis;
using Yoma.Core.Api.Common;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain;
using Yoma.Core.Domain.Core.Converters;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Infrastructure.AmazonS3;
using Yoma.Core.Infrastructure.AriesCloud;
using Yoma.Core.Infrastructure.Bitly;
using Yoma.Core.Infrastructure.Database;
using Yoma.Core.Infrastructure.Emsi;
using Yoma.Core.Infrastructure.Keycloak;
using Yoma.Core.Infrastructure.SendGrid;
using Yoma.Core.Infrastructure.Twilio;
using Yoma.Core.Infrastructure.Zlto;
using Yoma.Core.Infrastructure.SAYouth;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSharing;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mime;
using Flurl.Http;
using Flurl.Http.Newtonsoft;

namespace Yoma.Core.Api
{
  public class Startup
  {
    #region Class Variables
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IConfiguration _configuration;
    private readonly Domain.Core.Environment _environment;
    private readonly AppSettings _appSettings;
    private readonly IIdentityProviderAuthOptions _identityProviderAuthOptions;
    private const string OAuth_Scope_Separator = " ";
    private const string ConnectionStrings_RedisConnection = "RedisConnection";
    private const string Swagger_JsonUrl = $"/swagger/{Constants.Api_Version}/swagger.json";

    private static readonly string[] ExposedHeaders = ["Content-Disposition"];
    #endregion

    #region Constructors
    public Startup(IConfiguration configuration, IWebHostEnvironment env)
    {
      _configuration = configuration;
      _webHostEnvironment = env;
      _environment = EnvironmentHelper.FromString(_webHostEnvironment.EnvironmentName);

      var appSettings = _configuration.GetSection(AppSettings.Section).Get<AppSettings>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{AppSettings.Section}'");
      _appSettings = appSettings;

      _identityProviderAuthOptions = configuration.Configuration_IdentityProviderAuthenticationOptions();
    }
    #endregion

    #region Public Members
    public void ConfigureServices(IServiceCollection services)
    {
      #region Configuration
      services.Configure<AppSettings>(options =>
          _configuration.GetSection(AppSettings.Section).Bind(options));
      services.Configure<ScheduleJobOptions>(options =>
          _configuration.GetSection(ScheduleJobOptions.Section).Bind(options));

      services.AddSingleton<IEnvironmentProvider>(p => ActivatorUtilities.CreateInstance<EnvironmentProvider>(p, _webHostEnvironment.EnvironmentName));

      services.ConfigureServices_BlobProvider(_configuration);
      services.ConfigureServices_ShortLinkProvider(_configuration);
      services.ConfigureServices_LaborMarketProvider(_configuration);
      services.ConfigureServices_IdentityProvider(_configuration);
      services.ConfigureServices_EmailProvider(_configuration);
      services.ConfigureServices_MessageProvider(_configuration);
      services.ConfigureServices_RewardProvider(_configuration);
      services.ConfigureServices_SharingProvider(_configuration);
      #endregion Configuration

      #region System
      services.AddControllers(options =>
      {
        // Add the global Produces filter
        options.Filters.Add(new ProducesAttribute(MediaTypeNames.Application.Json));
        options.InputFormatters.Add(new ByteArrayInputFormatter());
      })
      .AddNewtonsoftJson(options =>
      {
        options.SerializerSettings.Converters.Add(new StringEnumConverter());
        options.SerializerSettings.Converters.Add(new StringTrimmingConverter());
      });

      services.AddMvc(options =>
      {
        options.Filters.Add(typeof(ReformatValidationProblemAttribute));
      });

      services.AddHttpContextAccessor();
      services.AddMemoryCache();
      services.AddHealthChecks().AddCheck("API Ready Check", () => HealthCheckResult.Healthy("API is up"), tags: ["ready"]);
      #endregion

      #region 3rd Party
      ConfigureCORS(services);
      services.ConfigureServices_AuthenticationIdentityProvider(_configuration);
      ConfigureAuthorization(services, _configuration);
      ConfigureSwagger(services);
      ConfigureFlurl();
      #endregion 3rd Party

      #region Services & Infrastructure
      services.ConfigureServices_DomainServices();

      services.ConfigureServices_InfrastructureBlobProvider();
      services.ConfigureServices_InfrastructureSSIProvider(_configuration, _configuration.Configuration_ConnectionString(), _appSettings);
      services.ConfigureServices_InfrastructureShortLinkProvider();
      services.ConfigureServices_InfrastructureDatabase(_configuration, _appSettings);
      services.ConfigureServices_InfrastructureLaborMarketProvider();
      services.ConfigureServices_InfrastructureIdentityProvider();
      services.ConfigureServices_InfrastructureSharingProvider();
      services.ConfigureServices_InfrastructureEmailProvider(_configuration);
      services.ConfigureServices_InfrastructureMessageProvider(_configuration);
      services.ConfigureServices_InfrastructureRewardProvider();

      services.ConfigureServices_DomainServicesCompositionFactory(sp =>
      {
        var factories = new Dictionary<Partner, ISharingProviderClientFactory>
            {
                { Partner.SAYouth, sp.GetRequiredService<ISharingProviderClientFactory>() }
            };
        return factories;
      });
      #endregion Services & Infrastructure

      #region 3rd Party (post ConfigureServices_InfrastructureDatabase)
      ConfigureRedis(services, _configuration);
      ConfigureHangfire(services, _configuration);
      #endregion 3rd Party (post ConfigureServices_InfrastructureDatabase)
    }

    public void Configure(IApplicationBuilder app)
    {
      #region 3rd Party
      app.UseSwagger();
      app.UseSwaggerUI(s =>
      {
        s.SwaggerEndpoint(Swagger_JsonUrl, $"Yoma Core Api ({_environment.ToDescription()} {Constants.Api_Version})");
        s.RoutePrefix = "";
        s.OAuthClientId(_identityProviderAuthOptions.ClientId);

        switch (_environment)
        {
          case Domain.Core.Environment.Local:
          case Domain.Core.Environment.Development:
            s.OAuthClientSecret(_identityProviderAuthOptions.ClientSecret);
            break;
        }

        s.OAuthScopeSeparator(OAuth_Scope_Separator);
      });

      app.UseReDoc(c =>
      {
        c.SpecUrl = Swagger_JsonUrl;
        c.RoutePrefix = "docs";
        c.DocumentTitle = $"Yoma Core Api ({_environment.ToDescription()}) ({Constants.Api_Version})";
      });
      #endregion 3rd Party

      #region System
      app.UseMiddleware<ExceptionResponseMiddleware>();
      app.UseMiddleware<ExceptionLogMiddleware>();
      app.UseCors();
      if (_appSettings.HttpsRedirectionEnabledEnvironmentsAsEnum.HasFlag(_environment)) app.UseHttpsRedirection();
      app.UseStaticFiles();
      app.UseRouting();
      app.UseAuthentication();
      app.UseAuthorization();

      app.UseHangfireDashboard(options: new DashboardOptions
      {
        DarkModeEnabled = true,
        IgnoreAntiforgeryToken = false, //data protection keys now in Redis; without replicas >=2 will cause antiforgery token issues
        Authorization = [new BasicAuthAuthorizationFilter(new BasicAuthAuthorizationFilterOptions
        {
          RequireSsl = false, //handled by AWS
          SslRedirect = false, //handled by AWS
          LoginCaseSensitive = true,
          Users = [new BasicAuthAuthorizationUser { Login = _appSettings.Hangfire.Username, PasswordClear = _appSettings.Hangfire.Password }]
        })]
      });

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapControllers();

        // basic check to ensure the API is up
        endpoints.MapHealthChecks($"/api/{Constants.Api_Version}/health/ready", new HealthCheckOptions
        {
          Predicate = (check) => check.Tags.Contains("ready")
        }).AllowAnonymous();

        // more detailed check to ensure the API can connect to the database
        endpoints.MapHealthChecks($"/api/{Constants.Api_Version}/health/live", new HealthCheckOptions
        {
          Predicate = (check) => check.Tags.Contains("live")
        }).AllowAnonymous();
      });

      //enabling sentry tracing causes endless information logs about 'Sentry trace header is null'
      //if (_environment != Domain.Core.Environment.Local) app.UseSentryTracing();
      #endregion

      #region 3rd Party
      app.UseSSIProvider();
      #endregion

      #region System
      app.UseEndpoints(endpoints =>
      {
        endpoints.MapControllers();
        endpoints.MapHangfireDashboard();
      });
      #endregion System

      #region 3rd Partry
      //migrations applied as part of ConfigureHangfire to ensure db exist prior to executing Hangfire migrations
      _configuration.Configure_RecurringJobs(_appSettings, _environment);
      #endregion 3rd Party
    }
    #endregion

    #region Private Members
    private static void ConfigureFlurl()
    {
      FlurlHttp.Clients.WithDefaults(builder => builder.Settings.JsonSerializer = new NewtonsoftJsonSerializer());
    }

    private void ConfigureCORS(IServiceCollection services)
    {
      const string _config_Section = "AllowedOrigins";

      var origins = _configuration.GetSection(_config_Section).Get<string>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section 'Config_Section'");
      var values = origins.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray();
      if (values.Length == 0)
        throw new InvalidOperationException($"Configuration section '{_config_Section}' contains no configured hosts");

      services.AddCors(options =>
      {
        options.AddDefaultPolicy(
                        builder =>
                        {
                          builder
                              .WithOrigins(values)
                              .AllowAnyHeader()
                              .AllowCredentials()
                              .AllowAnyMethod()
                              .WithExposedHeaders(ExposedHeaders);
                        });
      });
    }

    private void ConfigureAuthorization(IServiceCollection services, IConfiguration configuration)
    {
      services.AddAuthorizationBuilder()
          .AddPolicy(Constants.Authorization_Policy, policy =>
          {
            policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
            policy.RequireAuthenticatedUser();
            policy.Requirements.Add(new RequireAudienceClaimRequirement(_appSettings.AuthorizationPolicyAudience));
            policy.Requirements.Add(new RequireScopeAuthorizationRequirement(_appSettings.AuthorizationPolicyScope));
          })
          .AddPolicy(Constants.Authorization_Policy_External_Partner, policy =>
          {
            policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
            policy.RequireAuthenticatedUser();
            policy.Requirements.Add(new RequireAudienceClaimRequirement(_appSettings.AuthorizationPolicyAudience));
            policy.Requirements.Add(new RequireClientIdClaimRequirement());
            policy.Requirements.Add(new RequireScopeAuthorizationRequirement(_appSettings.AuthorizationPolicyScope));
          });
      services.AddSingleton<IAuthorizationHandler, RequireAudienceClaimHandler>();
      services.AddSingleton<IAuthorizationHandler, RequireClientIdClaimHandler>();
      services.AddSingleton<IAuthorizationHandler, RequireScopeAuthorizationHandler>();
      services.ConfigureServices_AuthorizationIdentityProvider(configuration);
    }

    private static void ConfigureHangfire(IServiceCollection services, IConfiguration configuration)
    {
      services.AddHangfire((serviceProvider, config) =>
      {
        var scopeFactory = serviceProvider.GetService<IServiceScopeFactory>() ?? throw new InvalidOperationException($"Failed to retrieve service '{nameof(IServiceScopeFactory)}'");
        serviceProvider.Configure_InfrastructureDatabase();
        serviceProvider.Configure_InfrastructureDatabaseSSIProvider();
        config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
             .UseActivator(new HangfireActivator(scopeFactory))
             .UseSimpleAssemblyNameTypeSerializer()
             .UseRecommendedSerializerSettings()
             .UsePostgreSqlStorage((configure) =>
             {
               configure.UseNpgsqlConnection(configuration.Configuration_ConnectionString());
             }, new PostgreSqlStorageOptions { SchemaName = "HangFire" });
      });

      services.AddHangfireServer(options =>
      {
        options.ServerTimeout = TimeSpan.FromHours(3); // ensures that jobs can run for up to 3 hours without being marked as timed out; MaxIntervalInHours set to 2 hours or less for all jobs
      });
    }

    public void ConfigureRedis(IServiceCollection services, IConfiguration configuration)
    {
      const string RedisKey_DataProtection = "yoma.core.api:keys:data_protection";

      var connectionString = configuration.GetConnectionString(ConnectionStrings_RedisConnection);
      if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException($"Failed to retrieve connection string '{ConnectionStrings_RedisConnection}'");

      var options = ConfigurationOptions.Parse(connectionString);

      if (options.Ssl && _appSettings.RedisSSLCertificateValidationBypass == true)
        options.CertificateValidation += (sender, certificate, chain, sslPolicyErrors) =>
        {
          return true;
        };

      var connectionMultiplexer = ConnectionMultiplexer.Connect(options);
      services.AddSingleton<IConnectionMultiplexer>(connectionMultiplexer);
      services.AddDataProtection().PersistKeysToStackExchangeRedis(connectionMultiplexer, RedisKey_DataProtection);
    }

    private void ConfigureSwagger(IServiceCollection services)
    {
      var scopesAuthorizationCode = _appSettings.SwaggerScopesAuthorizationCode.Split(OAuth_Scope_Separator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray();
      if (scopesAuthorizationCode.Length == 0)
        throw new InvalidOperationException($"Configuration section '{AppSettings.Section}' contains no configured swagger 'Authorization Code' scopes");

      var scopesClientCredentials = _appSettings.SwaggerScopesClientCredentials.Split(OAuth_Scope_Separator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray();
      if (scopesClientCredentials.Length == 0)
        throw new InvalidOperationException($"Configuration section '{AppSettings.Section}' contains no configured swagger 'Client Credentials' scopes");

      services.AddSwaggerGen(c =>
      {
        c.SwaggerDoc(Constants.Api_Version, new OpenApiInfo { Title = $"Yoma Core Api ({_environment.ToDescription()})", Version = Constants.Api_Version });
        c.EnableAnnotations();
        c.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
        {
          Description = $"JWT Authorization header using the {JwtBearerDefaults.AuthenticationScheme} scheme. Example: Authorization: {JwtBearerDefaults.AuthenticationScheme} {{token}}",
          Name = "Authorization",
          Type = SecuritySchemeType.OAuth2,
          Flows = new OpenApiOAuthFlows
          {
            AuthorizationCode = new OpenApiOAuthFlow()
            {
              Scopes = scopesAuthorizationCode.ToDictionary(item => item, item => item),
              TokenUrl = _identityProviderAuthOptions.TokenUrl,
              AuthorizationUrl = _identityProviderAuthOptions.AuthorizationUrl
            }
          }
        });

        c.OperationFilter<ProducesResponseTypesErrorFilter>();

        c.AddSecurityDefinition(Constants.AuthenticationScheme_ClientCredentials, new OpenApiSecurityScheme
        {
          Description = "Client Credentials flow using the client_id and client_secret",
          Type = SecuritySchemeType.OAuth2,
          Flows = new OpenApiOAuthFlows
          {
            ClientCredentials = new OpenApiOAuthFlow
            {
              Scopes = scopesClientCredentials.ToDictionary(item => item, item => item),
              TokenUrl = _identityProviderAuthOptions.TokenUrl
            }
          }
        });

        //custom api key authentication
        //c.AddSecurityDefinition(Common.Constants.RequestHeader_ApiKey, new OpenApiSecurityScheme
        //{
        //    Description = $"Api key authorization by {Common.Constants.RequestHeader_ApiKey} header. Example: \"{Common.Constants.RequestHeader_ApiKey} MyOrganizationApiKey\"",
        //    Name = Common.Constants.RequestHeader_ApiKey,
        //    In = ParameterLocation.Header,
        //    Type = SecuritySchemeType.ApiKey,
        //});

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
          {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = JwtBearerDefaults.AuthenticationScheme }
                        },
                        new[] { string.Join(OAuth_Scope_Separator, scopesAuthorizationCode) }
                    },
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = Constants.AuthenticationScheme_ClientCredentials }
                        },
                        new[] { string.Join(OAuth_Scope_Separator, scopesClientCredentials) }
                    }
          });

        //custom api key authentication
        //c.AddSecurityRequirement(new OpenApiSecurityRequirement()
        //{
        //    {
        //        new OpenApiSecurityScheme
        //        {
        //            Reference = new OpenApiReference
        //            {
        //                Type = ReferenceType.SecurityScheme,
        //                Id = Common.Constants.RequestHeader_ApiKey
        //            },
        //            Type = SecuritySchemeType.ApiKey,
        //            Name = Common.Constants.RequestHeader_ApiKey,
        //            In = ParameterLocation.Header
        //        },
        //        new List<string>()
        //    }
        //});
      });

      services.AddSwaggerGenNewtonsoftSupport();
    }
    #endregion
  }
}
