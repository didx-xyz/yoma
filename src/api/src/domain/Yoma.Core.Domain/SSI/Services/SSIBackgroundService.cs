using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Collections;
using System.Collections.Concurrent;
using System.Globalization;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Services
{
  public class SSIBackgroundService : ISSIBackgroundService
  {
    #region Class Variables
    private readonly ILogger<SSIBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ISSISchemaService _ssiSchemaService;
    private readonly ISSISchemaEntityService _ssiSchemaEntityService;
    private readonly ISSITenantService _ssiTenantService;
    private readonly ISSICredentialService _ssiCredentialService;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public SSIBackgroundService(ILogger<SSIBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IEnvironmentProvider environmentProvider,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IServiceScopeFactory scopeFactory,
        ISSISchemaService ssiSchemaService,
        ISSISchemaEntityService ssiSchemaEntityService,
        ISSITenantService ssiTenantService,
        ISSICredentialService ssiCredentialService,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _environmentProvider = environmentProvider;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _scopeFactory = scopeFactory;
      _ssiSchemaService = ssiSchemaService;
      _ssiSchemaEntityService = ssiSchemaEntityService;
      _ssiTenantService = ssiTenantService;
      _ssiCredentialService = ssiCredentialService;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Seeds the base and type-specific Opportunity defaults and the YoID identity schema.
    /// Only schema configuration is seeded in enabled environments; no credentials are issued here.
    /// Opportunity assignments are migrated separately; startup never rewrites them or their queues.
    /// </summary>
    public async Task SeedSchemas()
    {
      const string lockIdentifier = "ssi_seed_schemas";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (!_appSettings.SSIEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("{Process} skipped for environment '{environment}' at {dateStamp} as SSI is not enabled.", nameof(SeedSchemas), _environmentProvider.Environment, DateTimeOffset.UtcNow);
          return;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing SSI default schema seeding");

        // Learning and Other share the base claim set. Each distinct type adds its own configured CFs;
        // keys identify the definitions, while option labels and presentation come from the CF framework.
        await SeedSchema(ArtifactType.JWS,
          SSISSchemaHelper.ToDefaultFullName(Opportunity.Type.Learning),
          [
            "Opportunity_OrganizationName",
            "Opportunity_OrganizationLogoURL",
            "Opportunity_Title",
            "Opportunity_Summary",
            "Opportunity_Type",
            "Opportunity_Countries",
            "Opportunity_EngagementType",
            "Opportunity_Skills",
            "MyOpportunity_UserDisplayName",
            "MyOpportunity_CommitmentIntervalDescription",
            "MyOpportunity_Verifications"
          ]);

        await SeedSchema(ArtifactType.JWS,
          SSISSchemaHelper.ToDefaultFullName(Opportunity.Type.ImpactAction),
          [
            "Opportunity_OrganizationName",
            "Opportunity_OrganizationLogoURL",
            "Opportunity_Title",
            "Opportunity_Summary",
            "Opportunity_Type",
            "Opportunity_Countries",
            "Opportunity_EngagementType",
            "Opportunity_Skills",
            "MyOpportunity_UserDisplayName",
            "MyOpportunity_CommitmentIntervalDescription",
            "MyOpportunity_Verifications",
            "Opportunity_impactActionVerifiedActivityType",
            "MyOpportunity_impactActionImpactAchieved"
          ]);

        await SeedSchema(ArtifactType.JWS,
          SSISSchemaHelper.ToDefaultFullName(Opportunity.Type.Event),
          [
            "Opportunity_OrganizationName",
            "Opportunity_OrganizationLogoURL",
            "Opportunity_Title",
            "Opportunity_Summary",
            "Opportunity_Type",
            "Opportunity_Countries",
            "Opportunity_EngagementType",
            "Opportunity_Skills",
            "MyOpportunity_UserDisplayName",
            "MyOpportunity_CommitmentIntervalDescription",
            "MyOpportunity_Verifications",
            "MyOpportunity_eventRole"
          ]);

        await SeedSchema(ArtifactType.JWS,
          SSISSchemaHelper.ToDefaultFullName(Opportunity.Type.Job),
          [
            "Opportunity_OrganizationName",
            "Opportunity_OrganizationLogoURL",
            "Opportunity_Title",
            "Opportunity_Summary",
            "Opportunity_Type",
            "Opportunity_Countries",
            "Opportunity_EngagementType",
            "MyOpportunity_UserDisplayName",
            "MyOpportunity_CommitmentIntervalDescription",
            "MyOpportunity_Verifications",
            "Opportunity_jobIndustry",
            "Opportunity_jobCategory",
            "Opportunity_jobEmploymentType",
            "Opportunity_jobWorkSchedule",
            "Opportunity_jobEmploymentDuration",
            "Opportunity_jobEmploymentDurationUnit",
            "Opportunity_jobSalaryDisclosed",
            "Opportunity_jobSalaryMinimum",
            "Opportunity_jobSalaryMaximum",
            "Opportunity_jobSalaryCurrency",
            "Opportunity_jobPayInterval",
            "MyOpportunity_jobEmploymentStartDate"
          ]);

        await SeedSchema(ArtifactType.JWS,
          SSISSchemaHelper.ToDefaultFullName(Opportunity.Type.Entrepreneurship),
          [
            "Opportunity_OrganizationName",
            "Opportunity_OrganizationLogoURL",
            "Opportunity_Title",
            "Opportunity_Summary",
            "Opportunity_Type",
            "Opportunity_Countries",
            "Opportunity_EngagementType",
            "Opportunity_Skills",
            "MyOpportunity_UserDisplayName",
            "MyOpportunity_CommitmentIntervalDescription",
            "MyOpportunity_Verifications",
            "Opportunity_entrepreneurshipProgrammeType",
            "Opportunity_entrepreneurshipProgrammeOtherDescription",
            "MyOpportunity_entrepreneurshipBusinessName",
            "MyOpportunity_entrepreneurshipBusinessSummary",
            "MyOpportunity_entrepreneurshipBusinessRegistered",
            "MyOpportunity_entrepreneurshipRegistrationReference",
            "MyOpportunity_entrepreneurshipSector",
            "MyOpportunity_entrepreneurshipJobsCreated",
            "MyOpportunity_entrepreneurshipRevenueBand",
            "MyOpportunity_entrepreneurshipRevenueCurrency",
            "MyOpportunity_entrepreneurshipFundingTypes",
            "MyOpportunity_entrepreneurshipFundingAmountBand",
            "MyOpportunity_entrepreneurshipFunder",
            "MyOpportunity_entrepreneurshipClientLocation"
          ]);

        // YoID remains AnonCreds. Missing optional source values retain the established n/a handling;
        // user discovery preferences and precise coordinates are deliberately not identity claims.
        await SeedSchema(ArtifactType.ACR,
          _appSettings.SSISchemaFullNameYoID,
          [
            "Organization_Name",
            "Organization_LogoURL",
            "User_DisplayName",
            "User_FirstName",
            "User_Surname",
            "User_DateOfBirth",
            "User_Email",
            "User_Gender",
            "User_Education",
            "User_Country"
          ]);

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed SSI default schema seeding");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(SeedSchemas), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessTenantCreation()
    {
      const string lockIdentifier = "ssi_process_tenant_creation";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (!_appSettings.SSIEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("{Process} skipped for environment '{environment}' at {dateStamp} as SSI is not enabled.", nameof(ProcessTenantCreation), _environmentProvider.Environment, DateTimeOffset.UtcNow);
          return;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing SSI tenant creation");

        var itemIdsToSkip = new ConcurrentBag<Guid>();
        using var throttler = new SemaphoreSlim(_appSettings.SSIParallelism.TenantCreation, _appSettings.SSIParallelism.TenantCreation);

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var items = _ssiTenantService.ListPendingCreationSchedule(_scheduleJobOptions.SSITenantCreationScheduleBatchSize, [.. itemIdsToSkip]);
          if (items.Count == 0) break;

          var tasks = new List<Task>();
          foreach (var item in items)
          {
            if (executeUntil <= DateTimeOffset.UtcNow) break;

            await throttler.WaitAsync();

            tasks.Add(Task.Run(async () =>
            {
              await using var scope = _scopeFactory.CreateAsyncScope();
              var tenantService = scope.ServiceProvider.GetRequiredService<ISSITenantService>();
              var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
              var organizationService = scope.ServiceProvider.GetRequiredService<IOrganizationService>();
              var providerClientFactory = scope.ServiceProvider.GetRequiredService<ISSIProviderClientFactory>();
              var providerClient = providerClientFactory.CreateClient();

              try
              {
                if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing SSI tenant creation for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);

                TenantRequest request;
                var entityType = Enum.Parse<EntityType>(item.EntityType, true);
                switch (entityType)
                {
                  case EntityType.User:
                    if (!item.UserId.HasValue)
                      throw new InvalidOperationException($"Entity type '{item.EntityType}': User id is null");

                    var user = userService.GetById(item.UserId.Value, false, true);

                    var displayNameCleaned = user.DisplayName?.RemoveSpecialCharacters();
                    var displayNameFallback = user.Username.Contains('@')
                      ? user.Username.Split('@').First()
                      : user.Username.RemoveSpecialCharacters();

                    request = new TenantRequest
                    {
                      // utilize user id, ensuring a consistent tenant reference or name even if the name is altered
                      Referent = user.Id.ToString(),
                      Name = string.IsNullOrEmpty(displayNameCleaned) ? displayNameFallback : displayNameCleaned,
                      ImageUrl = user.PhotoURL,
                      Roles = [Role.Holder]
                    };
                    break;

                  case EntityType.Organization:
                    if (!item.OrganizationId.HasValue)
                      throw new InvalidOperationException($"Entity type '{item.EntityType}': Organization id is null");

                    var org = organizationService.GetById(item.OrganizationId.Value, false, true, false);

                    request = new TenantRequest
                    {
                      //requiring uniqueness for both the name (wallet label) and its corresponding referent (wallet name) as issuers and verifiers are published to the trust registry
                      Referent = org.NameHashValue, //use hash value of name; name can not be reused (see OrganizationService Create / Update)
                      Name = org.Name.RemoveSpecialCharacters(),
                      ImageUrl = org.LogoURL,
                      Roles = [Role.Holder, Role.Issuer, Role.Verifier]
                    };
                    break;

                  default:
                    throw new InvalidOperationException($"Entity type '{item.EntityType}' not supported");
                }

                item.TenantId = await providerClient.EnsureTenant(request);
                item.Status = TenantCreationStatus.Created;
                await tenantService.UpdateScheduleCreation(item);

                if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed SSI tenant creation for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);
              }
              catch (Exception ex)
              {
                if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to created SSI tenant for '{entityType}'and item with id '{id}': {errorMessage}", item.EntityType, item.Id, ex.Message);

                item.Status = TenantCreationStatus.Error;
                item.ErrorReason = ex.Message;
                await tenantService.UpdateScheduleCreation(item);

                itemIdsToSkip.Add(item.Id);
              }
              finally
              {
                throttler.Release();
              }
            }));
          }

          await Task.WhenAll(tasks).FlattenAggregateException();
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed SSI tenant creation");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessTenantCreation), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessCredentialIssuance()
    {
      const string lockIdentifier = "ssi_process_credential_issuance";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.SSICredentialIssuanceScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (!_appSettings.SSIEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("{Process} skipped for environment '{environment}' at {dateStamp} as SSI is not enabled.", nameof(ProcessCredentialIssuance), _environmentProvider.Environment, DateTimeOffset.UtcNow);
          return;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing SSI credential issuance");

        var itemIdsToSkip = new ConcurrentBag<Guid>();
        using var throttler = new SemaphoreSlim(_appSettings.SSIParallelism.CredentialIssuance, _appSettings.SSIParallelism.CredentialIssuance);

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var now = DateTimeOffset.UtcNow;

          var items = _ssiCredentialService.ListPendingIssuanceSchedule(_scheduleJobOptions.SSICredentialIssuanceScheduleBatchSize, [.. itemIdsToSkip]);
          if (items.Count == 0) break;

          var tasks = new List<Task>();
          foreach (var item in items)
          {
            if (executeUntil <= DateTimeOffset.UtcNow) break;

            await throttler.WaitAsync();

            tasks.Add(Task.Run(async () =>
            {
              await using var scope = _scopeFactory.CreateAsyncScope();
              var credentialService = scope.ServiceProvider.GetRequiredService<ISSICredentialService>();
              var schemaService = scope.ServiceProvider.GetRequiredService<ISSISchemaService>();
              var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
              var organizationService = scope.ServiceProvider.GetRequiredService<IOrganizationService>();
              var myOpportunityService = scope.ServiceProvider.GetRequiredService<IMyOpportunityService>();
              var opportunityService = scope.ServiceProvider.GetRequiredService<IOpportunityService>();
              var customFieldDefinitionService = scope.ServiceProvider.GetRequiredService<ICustomFieldDefinitionService>();
              var customFieldValueService = scope.ServiceProvider.GetRequiredService<ICustomFieldValueService>();
              var tenantService = scope.ServiceProvider.GetRequiredService<ISSITenantService>();
              var providerClientFactory = scope.ServiceProvider.GetRequiredService<ISSIProviderClientFactory>();
              var providerClient = providerClientFactory.CreateClient();

              try
              {
                if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing SSI credential issuance for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);

                var request = new CredentialIssuanceRequest
                {
                  ClientReferent = new KeyValuePair<string, string>(SSISchemaService.SchemaAttribute_Internal_ReferentClient, item.Id.ToString()),
                  SchemaType = item.SchemaType.ToString(),
                  Attributes = new Dictionary<string, string>()
                                {
                                    { SSISchemaService.SchemaAttribute_Internal_DateIssued, now.ToString("O", CultureInfo.InvariantCulture)},
                                    { SSISchemaService.SchemaAttribute_Internal_ReferentClient, item.Id.ToString()}
                                }
                };

                SSISchema schema;
                User user;
                (bool proceed, string tenantId) tenantIssuer;
                (bool proceed, string tenantId) tenantHolder;
                switch (item.SchemaType)
                {
                  case SchemaType.YoID:
                    if (!item.UserId.HasValue)
                      throw new InvalidOperationException($"Schema type '{item.SchemaType}': 'User id is null");
                    user = userService.GetById(item.UserId.Value, true, true);
                    user.DisplayName ??= user.Username; //default display name to username if null

                    var organization = organizationService.GetByNameOrNull(_appSettings.YomaOrganizationName, true, true);
                    if (organization == null)
                    {
                      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing of SSI credential issuance for schema type '{schemaType}' and item with id '{id}' " +
                          "was skipped as the '{orgName}' organization could not be found", item.SchemaType, item.Id, _appSettings.YomaOrganizationName);
                      itemIdsToSkip.Add(item.Id);
                      return;
                    }

                    tenantIssuer = GetTenantId(tenantService, item, EntityType.Organization, organization.Id);
                    if (!tenantIssuer.proceed)
                    {
                      itemIdsToSkip.Add(item.Id);
                      return;
                    }
                    request.TenantIdIssuer = tenantIssuer.tenantId;

                    tenantHolder = GetTenantId(tenantService, item, EntityType.User, user.Id);
                    if (!tenantHolder.proceed)
                    {
                      itemIdsToSkip.Add(item.Id);
                      return;
                    }
                    request.TenantIdHolder = tenantHolder.tenantId;

                    schema = await schemaService.GetByFullName(item.SchemaName);
                    AssertIssuanceSchemaApplicable(schema, item);

                    request.SchemaId = schema.Id;
                    request.SchemaName = schema.Name;
                    request.ArtifactType = schema.ArtifactType;

                    foreach (var entity in schema.Entities)
                    {
                      var entityType = Type.GetType(entity.TypeName)
                          ?? throw new InvalidOperationException($"Failed to get the entity of type '{entity.TypeName}'");

                      switch (entityType)
                      {
                        case Type t when t == typeof(User):
                          ReflectEntityValues(request, entity, t, user, customFieldDefinitionService, customFieldValueService);
                          break;

                        case Type t when t == typeof(Organization):
                          ReflectEntityValues(request, entity, t, organization, customFieldDefinitionService, customFieldValueService);
                          break;

                        default:
                          throw new InvalidOperationException($"Entity of type '{entity.TypeName}' not supported");
                      }
                    }
                    break;

                  case SchemaType.Opportunity:
                    if (!item.MyOpportunityId.HasValue)
                      throw new InvalidOperationException($"Schema type '{item.SchemaType}': 'My' opportunity id is null");
                    var myOpportunity = myOpportunityService.GetById(item.MyOpportunityId.Value, true, true, false);
                    var opportunity = opportunityService.GetById(myOpportunity.OpportunityId, true, true, false);

                    opportunity.Difficulty = ResolveLegacyDifficulty(opportunity, customFieldDefinitionService, customFieldValueService);

                    tenantIssuer = GetTenantId(tenantService, item, EntityType.Organization, myOpportunity.OrganizationId);
                    if (!tenantIssuer.proceed)
                    {
                      itemIdsToSkip.Add(item.Id);
                      return;
                    }
                    request.TenantIdIssuer = tenantIssuer.tenantId;

                    tenantHolder = GetTenantId(tenantService, item, EntityType.User, myOpportunity.UserId);
                    if (!tenantHolder.proceed)
                    {
                      itemIdsToSkip.Add(item.Id);
                      return;
                    }
                    request.TenantIdHolder = tenantHolder.tenantId;

                    // Scheduling commits the schema name. Later Opportunity changes must not cancel or redirect an
                    // already scheduled credential; processing resolves only the latest version of that schema.
                    schema = await schemaService.GetByFullName(item.SchemaName);
                    AssertIssuanceSchemaApplicable(schema, item);
                    request.SchemaId = schema.Id;
                    request.SchemaName = schema.Name;
                    request.ArtifactType = schema.ArtifactType;

                    foreach (var entity in schema.Entities)
                    {
                      var entityType = Type.GetType(entity.TypeName)
                          ?? throw new InvalidOperationException($"Failed to get the entity of type '{entity.TypeName}'");

                      switch (entityType)
                      {
                        case Type t when t == typeof(Opportunity.Models.Opportunity):
                          ReflectEntityValues(request, entity, t, opportunity, customFieldDefinitionService, customFieldValueService);
                          break;

                        case Type t when t == typeof(MyOpportunity.Models.MyOpportunity):
                          ReflectEntityValues(request, entity, t, myOpportunity, customFieldDefinitionService, customFieldValueService);
                          break;

                        default:
                          throw new InvalidOperationException($"Entity of type '{entity.TypeName}' not supported");
                      }
                    }
                    break;

                  default:
                    throw new InvalidOperationException($"Schema type '{item.SchemaType}' not supported");
                }

                var credential = await providerClient.IssueCredential(request);
                ArgumentNullException.ThrowIfNull(credential);
                ArgumentException.ThrowIfNullOrWhiteSpace(credential.Id);
                ArgumentException.ThrowIfNullOrWhiteSpace(credential.SchemaId);

                // A provider-success/local-failure retry can recover a credential issued against an older
                // version. Record that credential's schema, not the latest version used to prepare this attempt.
                if (credential.SchemaId != schema.Id)
                  schema = await schemaService.GetById(credential.SchemaId);

                AssertIssuanceSchemaApplicable(schema, item);

                item.CredentialId = credential.Id;
                item.SchemaVersion = schema.Version.ToString();
                item.Status = CredentialIssuanceStatus.Issued;
                await credentialService.UpdateScheduleIssuance(item);

                if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed SSI credential issuance for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);
              }
              catch (Exception ex)
              {
                if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to issue SSI credential for schema type '{schemaType}' and item with id '{id}': {errorMessage}", item.SchemaType, item.Id, ex.Message);

                item.Status = CredentialIssuanceStatus.Error;
                item.ErrorReason = ex.Message;
                await credentialService.UpdateScheduleIssuance(item);

                itemIdsToSkip.Add(item.Id);
              }
              finally
              {
                throttler.Release();
              }
            }));
          }

          await Task.WhenAll(tasks).FlattenAggregateException();
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed SSI credential issuance");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessCredentialIssuance), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private static void AssertIssuanceSchemaApplicable(SSISchema schema, SSICredentialIssuance item)
    {
      if (!string.Equals(schema.Name, item.SchemaName, StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException($"SSI schema '{schema.Name}' does not match scheduled schema '{item.SchemaName}'");

      if (schema.Type != item.SchemaType)
        throw new InvalidOperationException($"SSI schema '{schema.Name}' is not applicable to schema type '{item.SchemaType}'");

      if (schema.ArtifactType != item.ArtifactType)
      {
        throw new InvalidOperationException(
          $"SSI schema '{schema.Name}' is not applicable to artifact type '{item.ArtifactType}'");
      }
    }

    private (bool proceed, string tenantId) GetTenantId(ISSITenantService tenantService, SSICredentialIssuance item, EntityType entityType, Guid entityId)
    {
      var tenantIdIssuer = tenantService.GetTenantIdOrNull(entityType, entityId);
      if (string.IsNullOrEmpty(tenantIdIssuer))
      {
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
            "Processing of SSI credential issuance for schema type '{schemaType}' and item with id '{id}' " +
            "was skipped as the SSI tenant creation for entity of type '{entityType}' and with id '{entityId}' has not been completed", item.SchemaType, item.Id, entityType, entityId);
        return (false, string.Empty);
      }
      return (true, tenantIdIssuer);
    }

    private async Task SeedSchema(ArtifactType artifactType, string schemaFullName, List<string> attributes)
    {
      var schema = await _ssiSchemaService.GetByFullNameOrNull(schemaFullName);
      if (schema == null || schema.ArtifactType != artifactType) //allow switching of artifact stores; version incrementally incremented across stores
      {
        var (schemaType, displayName, typeContext) = _ssiSchemaService.SchemaFullNameValidateAndGetParts(schemaFullName);
        await _ssiSchemaService.Create(new SSISchemaRequestCreate
        {
          TypeId = schemaType.Id,
          TypeContext = typeContext,
          Name = displayName,
          ArtifactType = artifactType,
          Attributes = attributes
        });

        return;
      }

      if (schema.ArtifactType != artifactType)
        throw new InvalidOperationException($"Artifact type mismatch detected for existing schema '{schemaFullName}': Requested '{artifactType.ToDescription()}' vs. Existing '{schema.ArtifactType.ToDescription()}'");

      // Create/Update always adds compatible system properties. Include these in the expected set,
      // but compare only public entity attributes: internal attributes are not returned in Entities.
      // Full-set comparison detects removals as well as additions; ordering alone never creates a version.
      var expectedAttributes = attributes
        .Concat(_ssiSchemaEntityService.List(schema.Type, schema.TypeContext)
          .SelectMany(entity => entity.Properties?.Where(property => property.System) ?? [])
          .Select(property => property.AttributeName))
        .Select(attribute => attribute.Trim())
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

      var existingAttributes = schema.Entities
        .SelectMany(entity => (entity.Properties?.Select(property => property.AttributeName) ?? [])
          .Concat(entity.CustomFields?.Select(customField => customField.AttributeName) ?? []))
        .Select(attribute => attribute.Trim())
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

      if (expectedAttributes.SetEquals(existingAttributes)) return;

      await _ssiSchemaService.Update(new SSISchemaRequestUpdate
      {
        Name = schema.Name,
        Attributes = attributes
      });
    }

    /// <summary>
    /// Maps static schema properties into the signed credential. Required values must be present. JWS credentials
    /// omit optional values without content; ACR credentials retain an "n/a" placeholder because AnonCreds requires
    /// every schema attribute to have a value. Wallet retrieval supports both representations.
    /// </summary>
    private static void ReflectEntityValues<T>(CredentialIssuanceRequest request, SSISchemaEntity schemaEntity, Type type, T entity,
      ICustomFieldDefinitionService customFieldDefinitionService, ICustomFieldValueService customFieldValueService)
      where T : class
    {
      foreach (var prop in schemaEntity.Properties ?? [])
      {
        var propNameParts = prop.Name.Split('.');
        if (propNameParts.Length == 0 || propNameParts.Length > 2)
          throw new InvalidOperationException($"Entity '{schemaEntity.Name}' has an property with no name or a multi-part property are more than one level deep");

        var multiPart = propNameParts.Length > 1;

        var propValue = string.Empty;
        var propInfo = type.GetProperty(propNameParts.First())
            ?? throw new InvalidOperationException($"Entity property '{prop.Name}' not found in entity '{schemaEntity.Name}'");

        var propValueObject = propInfo.GetValue(entity);
        if (prop.Required && propValueObject == null)
          throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but is null");
        if (propValueObject == null)
        {
          MapOptionalCredentialAttributeWithoutValue(request, prop.AttributeName);
          continue;
        }

        if (multiPart)
        {
          var valList = propValueObject as IList
              ?? throw new InvalidOperationException($"Multi-part property '{prop.Name}''s parent is not of type List<>");

          if (prop.Required && valList.Count == 0)
            throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but is an empty list");

          var items = valList
               .Cast<object>()
               .Where(item => item != null)
               .Select(item =>
               {
                 var skillType = item.GetType();
                 var nameProperty = skillType.GetProperty(propNameParts.Last());
                 if (nameProperty != null)
                 {
                   return nameProperty.GetValue(item)?.ToString();
                 }
                 return null;
               })
                .Select(name => name?.Trim())
                .Where(name => !string.IsNullOrEmpty(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(name => new SSICredentialAttributeItem { Name = name! })
               .ToList();

          if (prop.Required && items.Count == 0)
            throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but contains no values");
          if (items.Count == 0)
          {
            MapOptionalCredentialAttributeWithoutValue(request, prop.AttributeName);
            continue;
          }

          // Complex properties are stored as JSON within the provider's string attribute contract. Wallet rendering
          // normalizes both this representation and historical comma-delimited values into the same display contract.
          propValue = JsonConvert.SerializeObject(items);
        }
        else
        {
          // New credentials use culture-independent values. Wallet retrieval retains a current-culture fallback for
          // credentials issued before this normalization, when DateTime values were serialized by the API host culture.
          propValue = propValueObject switch
          {
            DateTimeOffset value => value.ToString("O", CultureInfo.InvariantCulture),
            DateTime value => value.ToString("O", CultureInfo.InvariantCulture),
            IFormattable value => value.ToString(null, CultureInfo.InvariantCulture),
            _ => propValueObject.ToString()
          };
          propValue = propValue?.Trim();
          if (string.IsNullOrEmpty(propValue))
          {
            if (prop.Required)
              throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but has no value");
            MapOptionalCredentialAttributeWithoutValue(request, prop.AttributeName);
            continue;
          }
        }

        request.Attributes.Add(prop.AttributeName, propValue);
      }

      MapCustomFieldValues(request, schemaEntity, entity, customFieldDefinitionService, customFieldValueService);
    }

    /// <summary>
    /// TODO [CF / SSI]: Remove this method, its call and Opportunity.Difficulty once remaining
    /// queued/custom schemas no longer select the legacy mapping. New defaults already omit it.
    /// Resolve labels through the existing CF framework; never duplicate seeded options.
    /// Job experience is not legacy difficulty and must not be substituted.
    /// </summary>
    private static string? ResolveLegacyDifficulty(Opportunity.Models.Opportunity opportunity,
      ICustomFieldDefinitionService definitionService, ICustomFieldValueService valueService)
    {
      var key = opportunity.Type switch
      {
        Opportunity.Type.Learning => Opportunity.CustomFieldConstants.Difficulty.Keys.Learning,
        Opportunity.Type.Other => Opportunity.CustomFieldConstants.Difficulty.Keys.Other,
        Opportunity.Type.ImpactAction => Opportunity.CustomFieldConstants.Difficulty.Keys.ImpactAction,
        Opportunity.Type.Event => Opportunity.CustomFieldConstants.Difficulty.Keys.Event,
        Opportunity.Type.Job or Opportunity.Type.Entrepreneurship => null,
        _ => throw new NotSupportedException($"Opportunity type '{opportunity.Type}' is not supported")
      };
      if (key == null) return null;

      var value = opportunity.CustomFields?.SingleOrDefault(o => o.Key == key);
      if (value == null) return null;

      var definition = definitionService.GetByKey(CustomFieldEntityType.Opportunity, key, true, false);
      return valueService.ResolveDisplayValues(definition, value).SingleOrDefault();
    }

    /// <summary>
    /// Maps dynamic custom fields by stable definition keys without CLR reflection.
    /// </summary>
    private static void MapCustomFieldValues<T>(CredentialIssuanceRequest request, SSISchemaEntity schemaEntity, T entity,
      ICustomFieldDefinitionService customFieldDefinitionService, ICustomFieldValueService customFieldValueService)
      where T : class
    {
      if (schemaEntity.CustomFields == null || schemaEntity.CustomFields.Count == 0) return;

      if (!Enum.TryParse<CustomFieldEntityType>(schemaEntity.Name, true, out var entityType))
        throw new InvalidOperationException($"Schema entity '{schemaEntity.Name}' does not support custom fields");

      var values = entity switch
      {
        Opportunity.Models.Opportunity opportunity => opportunity.CustomFields,
        MyOpportunity.Models.MyOpportunity myOpportunity => myOpportunity.CustomFields,
        _ => throw new InvalidOperationException($"Entity '{schemaEntity.Name}' does not support custom fields")
      };

      foreach (var customField in schemaEntity.CustomFields)
      {
        var definition = customFieldDefinitionService.GetByKey(entityType, customField.Key, true, false);
        var value = values?.SingleOrDefault(item => string.Equals(item.Key, customField.Key, StringComparison.OrdinalIgnoreCase));
        var valuesDisplay = value == null ? [] : customFieldValueService.ResolveDisplayValues(definition, value);

        if (customField.Required && valuesDisplay.Count == 0)
          throw new InvalidOperationException($"Custom field '{customField.Key}' marked as required but has no value");
        if (valuesDisplay.Count == 0)
        {
          MapOptionalCredentialAttributeWithoutValue(request, customField.AttributeName);
          continue;
        }

        // Custom-field credentials are new, so multi-select values use the structured provider representation from
        // inception. JWS omits optional fields without values, while the shared ACR rule supplies its required placeholder.
        request.Attributes.Add(customField.AttributeName, valuesDisplay.Count switch
        {
          _ when customField.SupportsMultiple == true => JsonConvert.SerializeObject(
            valuesDisplay.Select(name => new SSICredentialAttributeItem { Name = name })),
          _ => valuesDisplay.Single()
        });
      }
    }

    /// <summary>
    /// JWS payloads can omit an optional schema attribute. AnonCreds credential definitions cannot, so ACR uses the
    /// established "n/a" placeholder while preserving the domain-level distinction that the value is optional.
    /// </summary>
    private static void MapOptionalCredentialAttributeWithoutValue(CredentialIssuanceRequest request, string attributeName)
    {
      switch (request.ArtifactType)
      {
        case ArtifactType.JWS:
          return;

        case ArtifactType.ACR:
          request.Attributes.Add(attributeName, "n/a");
          return;

        default:
          throw new InvalidOperationException($"Artifact type '{request.ArtifactType}' not supported");
      }
    }
    #endregion
  }
}
