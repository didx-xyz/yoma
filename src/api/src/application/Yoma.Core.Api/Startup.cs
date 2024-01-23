using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Infrastructure.Database;
using Yoma.Core.Domain;
using Yoma.Core.Domain.Core.Models;
using Microsoft.OpenApi.Models;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core.Extensions;
using Newtonsoft.Json.Converters;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Yoma.Core.Domain.Core.Converters;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Yoma.Core.Infrastructure.Keycloak;
using Yoma.Core.Infrastructure.Emsi;
using Hangfire;
using Hangfire.SqlServer;
using Hangfire.Dashboard;
using Hangfire.Dashboard.BasicAuthorization;
using Yoma.Core.Infrastructure.SendGrid;
using Yoma.Core.Infrastructure.AmazonS3;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Infrastructure.Zlto;
using Yoma.Core.Infrastructure.AriesCloud;

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
        private const string _oAuth_Scope_Separator = " ";
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
            services.ConfigureServices_IdentityProvider(_configuration);
            services.ConfigureServices_LaborMarketProvider(_configuration);
            services.ConfigureServices_RewardProvider(_configuration);
            services.AddSingleton<IEnvironmentProvider>(p => ActivatorUtilities.CreateInstance<EnvironmentProvider>(p, _webHostEnvironment.EnvironmentName));
            services.ConfigureServices_EmailProvider(_configuration);
            services.ConfigureServices_BlobProvider(_configuration);
            #endregion Configuration

            #region System
            services.AddControllers(options => options.InputFormatters.Add(new ByteArrayInputFormatter()))
                .AddNewtonsoftJson(options => options.SerializerSettings.Converters.Add(new StringEnumConverter()))
                .AddNewtonsoftJson(options => options.SerializerSettings.Converters.Add(new StringTrimmingConverter()));

            services.AddMvc(options =>
            {
                options.Filters.Add(typeof(ReformatValidationProblemAttribute));
            });

            services.AddHttpContextAccessor();
            services.AddMemoryCache();
            #endregion

            #region 3rd Party
            ConfigureCORS(services);
            services.ConfigureServices_AuthenticationIdentityProvider(_configuration);
            ConfigureAuthorization(services, _configuration);
            ConfigureSwagger(services);
            #endregion 3rd Party

            #region Services & Infrastructure
            services.ConfigureServices_DomainServices();
            services.ConfigureServices_InfrastructureSSIProvider(_configuration, _configuration.Configuration_ConnectionString());
            services.ConfigureServices_InfrastructureBlobProvider();
            services.ConfigureServices_InfrastructureIdentityProvider();
            services.ConfigureServices_InfrastructureLaborMarketProvider();
            services.ConfigureServices_InfrastructureEmailProvider(_configuration);
            services.ConfigureServices_InfrastructureRewardProvider();
            services.ConfigureServices_InfrastructureDatabase(_configuration);
            #endregion Services & Infrastructure

            #region 3rd Party (post ConfigureServices_InfrastructureDatabase)
            ConfigureHangfire(services, _configuration);
            #endregion 3rd Party (post ConfigureServices_InfrastructureDatabase)
        }

        public void Configure(IApplicationBuilder app)
        {
            #region 3rd Party
            app.UseSwagger();
            app.UseSwaggerUI(s =>
            {
                s.SwaggerEndpoint("/swagger/v3/swagger.json", $"Yoma Core Api ({_environment.ToDescription()} v3)");
                s.RoutePrefix = "";
                s.OAuthClientId(_identityProviderAuthOptions.ClientId);
                s.OAuthClientSecret(_identityProviderAuthOptions.ClientSecret);
                s.OAuthScopeSeparator(_oAuth_Scope_Separator);
            });
            #endregion 3rd Party

            #region System
            app.UseMiddleware<ExceptionResponseMiddleware>();
            app.UseMiddleware<ExceptionLogMiddleware>();
            app.UseCors();
            if (_appSettings.HttpsRedirectionEnabledEnvironmentsAsEnum.HasFlag(_environment)) app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseRouting();

            //enabling sentry tracing causes endless information logs about 'Sentry trace header is null'
            //if (_environment != Domain.Core.Environment.Local) app.UseSentryTracing();

            app.UseAuthentication();
            app.UseAuthorization();
            #endregion

            #region 3rd Party
            app.UseHangfireDashboard(options: new DashboardOptions
            {
                DarkModeEnabled = true,
                Authorization = new IDashboardAuthorizationFilter[]
                {
                    new BasicAuthAuthorizationFilter(
                        new BasicAuthAuthorizationFilterOptions
                        {
                            RequireSsl = false, //handled by AWS
                            SslRedirect = false, //handled by AWS
                            LoginCaseSensitive = true,
                            Users = new[]
                            {
                                new BasicAuthAuthorizationUser
                                {
                                    Login = _appSettings.Hangfire.Username,
                                    PasswordClear = _appSettings.Hangfire.Password
                                }
                            }
                        })
                }
            });

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
        private void ConfigureCORS(IServiceCollection services)
        {
            const string _config_Section = "AllowedOrigins";

            var origins = _configuration.GetSection(_config_Section).Get<string>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section 'Config_Section'");
            var values = origins.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray();
            if (!values.Any())
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
                            .AllowAnyMethod();
                          });
            });
        }

        private static void ConfigureAuthorization(IServiceCollection services, IConfiguration configuration)
        {
            services.AddAuthorization(options =>
            {
                options.AddPolicy(Common.Constants.Authorization_Policy, policy =>
                {
                    policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                    policy.Requirements.Add(new RequireClaimAuthorizationRequirement());
                });
            });
            services.AddSingleton<IAuthorizationHandler, RequiredClaimAuthorizationHandler>();
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
               .UseSqlServerStorage(configuration.Configuration_ConnectionString(), new SqlServerStorageOptions
               {
                   PrepareSchemaIfNecessary = true,
                   CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
                   SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
                   QueuePollInterval = TimeSpan.Zero,
                   UseRecommendedIsolationLevel = true,
                   DisableGlobalLocks = false
               });
            });

            services.AddHangfireServer();
        }

        private void ConfigureSwagger(IServiceCollection services)
        {
            var scopes = _appSettings.SwaggerScopes.Split(_oAuth_Scope_Separator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray();
            if (!scopes.Any())
                throw new InvalidOperationException($"Configuration section '{AppSettings.Section}' contains no configured swagger scopes");

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v3", new OpenApiInfo { Title = $"Yoma Core Api ({_environment.ToDescription()})", Version = "v3" });
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
                            Scopes = scopes.ToDictionary(item => item, item => item),
                            TokenUrl = _identityProviderAuthOptions.TokenUrl,
                            AuthorizationUrl = _identityProviderAuthOptions.AuthorizationUrl
                        }
                    }
                });

                c.AddSecurityDefinition(Common.Constants.RequestHeader_ApiKey, new OpenApiSecurityScheme
                {
                    Description = $"Api key authorization by {Common.Constants.RequestHeader_ApiKey} header. Example: \"{Common.Constants.RequestHeader_ApiKey} MyOrganizationApiKey\"",
                    Name = Common.Constants.RequestHeader_ApiKey,
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = JwtBearerDefaults.AuthenticationScheme }
                        },
                        new[] { string.Join(_oAuth_Scope_Separator, scopes) }
                    }
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement()
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = Common.Constants.RequestHeader_ApiKey
                            },
                            Name = Common.Constants.RequestHeader_ApiKey,
                            In = ParameterLocation.Header,
                        },
                        new List<string>()
                    }
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement()
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = Common.Constants.RequestHeader_ApiKey
                            },
                            Type = SecuritySchemeType.ApiKey,
                            Name = Common.Constants.RequestHeader_ApiKey,
                            In = ParameterLocation.Header
                        },
                        new List<string>()
                    }
                });
            });
            services.AddSwaggerGenNewtonsoftSupport();
        }
        #endregion
    }
}
