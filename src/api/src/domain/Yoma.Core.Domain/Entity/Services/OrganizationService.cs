using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Entity.Events;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Extensions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Domain.Entity.Services
{
  public class OrganizationService : IOrganizationService
  {
    #region Class Variables
    private readonly ILogger<OrganizationService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserService _userService;
    private readonly IIdentityProviderClient _identityProviderClient;
    private readonly IOrganizationStatusService _organizationStatusService;
    private readonly IOrganizationProviderTypeService _providerTypeService;
    private readonly IBlobService _blobService;
    private readonly ISSITenantService _ssiTenantService;
    private readonly INotificationURLFactory _notificationURLFactory;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly ISettingsDefinitionService _settingsDefinitionService;
    private readonly OrganizationRequestValidatorCreate _organizationCreateRequestValidator;
    private readonly OrganizationRequestValidatorUpdate _organizationUpdateRequestValidator;
    private readonly OrganizationSearchFilterValidator _organizationSearchFilterValidator;
    private readonly OrganizationRequestUpdateStatusValidator _organizationRequestUpdateStatusValidator;
    private readonly SettingsRequestValidator _settingsRequestValidator;

    private readonly IMediator _mediator;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;
    private readonly IRepository<OrganizationUser> _organizationUserRepository;
    private readonly IRepository<Models.OrganizationProviderType> _organizationProviderTypeRepository;
    private readonly IRepository<OrganizationDocument> _organizationDocumentRepository;
    private readonly IExecutionStrategyService _executionStrategyService;

    private static readonly OrganizationStatus[] Statuses_Updatable = [OrganizationStatus.Active, OrganizationStatus.Inactive, OrganizationStatus.Declined];
    private static readonly OrganizationStatus[] Statuses_Activatable = [OrganizationStatus.Inactive];
    private static readonly OrganizationStatus[] Statuses_DeActivatable = [OrganizationStatus.Active, OrganizationStatus.Declined];
    private static readonly OrganizationStatus[] Statuses_Declinable = [OrganizationStatus.Inactive];
    private static readonly OrganizationStatus[] Statuses_CanDelete = [OrganizationStatus.Active, OrganizationStatus.Inactive, OrganizationStatus.Declined];
    #endregion

    #region Constructor
    public OrganizationService(ILogger<OrganizationService> logger,
        IOptions<AppSettings> appSettings,
        IHttpContextAccessor httpContextAccessor,
        IUserService userService,
        IIdentityProviderClientFactory identityProviderClientFactory,
        IOrganizationStatusService organizationStatusService,
        IOrganizationProviderTypeService providerTypeService,
        IBlobService blobService,
        ISSITenantService ssiTenantService,
        INotificationURLFactory notificationURLFactory,
        INotificationDeliveryService notificationDeliveryService,
        ISettingsDefinitionService settingsDefinitionService,
        OrganizationRequestValidatorCreate organizationCreateRequestValidator,
        OrganizationRequestValidatorUpdate organizationUpdateRequestValidator,
        OrganizationSearchFilterValidator organizationSearchFilterValidator,
        OrganizationRequestUpdateStatusValidator organizationRequestUpdateStatusValidator,
        SettingsRequestValidator settingsRequestValidator,
        IMediator mediator,
        IRepositoryBatchedValueContainsWithNavigation<Organization> organizationRepository,
        IRepository<OrganizationUser> organizationUserRepository,
        IRepository<Models.OrganizationProviderType> organizationProviderTypeRepository,
        IRepository<OrganizationDocument> organizationDocumentRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _httpContextAccessor = httpContextAccessor;
      _userService = userService;
      _identityProviderClient = identityProviderClientFactory.CreateClient();
      _organizationStatusService = organizationStatusService;
      _providerTypeService = providerTypeService;
      _blobService = blobService;
      _ssiTenantService = ssiTenantService;
      _notificationURLFactory = notificationURLFactory;
      _notificationDeliveryService = notificationDeliveryService;
      _settingsDefinitionService = settingsDefinitionService;
      _organizationCreateRequestValidator = organizationCreateRequestValidator;
      _organizationUpdateRequestValidator = organizationUpdateRequestValidator;
      _organizationSearchFilterValidator = organizationSearchFilterValidator;
      _organizationRequestUpdateStatusValidator = organizationRequestUpdateStatusValidator;
      _settingsRequestValidator = settingsRequestValidator;
      _mediator = mediator;
      _organizationRepository = organizationRepository;
      _organizationUserRepository = organizationUserRepository;
      _organizationProviderTypeRepository = organizationProviderTypeRepository;
      _organizationDocumentRepository = organizationDocumentRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public Organization GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = GetByIdOrNull(id, includeChildItems, includeComputed, ensureOrganizationAuthorization)
          ?? throw new EntityNotFoundException($"{nameof(Organization)} with id '{id}' does not exist");

      return result;
    }

    public Organization? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      if (ensureOrganizationAuthorization)
        IsAdmin(result, true);

      if (includeComputed)
      {
        result.LogoURL = GetBlobObjectURL(result.LogoStorageType, result.LogoKey);
        result.Documents?.ForEach(o => o.Url = GetBlobObjectURL(o.FileStorageType, o.FileKey));
        result.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.Organization), result.SettingsRaw);
        result.ZltoRewardBalance = result.ZltoRewardPool.HasValue ? result.ZltoRewardPool - (result.ZltoRewardCumulative ?? default) : null;
        result.YomaRewardBalance = result.YomaRewardPool.HasValue ? result.YomaRewardPool - (result.YomaRewardCumulative ?? default) : null;
      }

      return result;
    }

    public Organization? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(name, nameof(name));
      name = name.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Name.ToLower() == name.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (result == null) return null;

      if (includeComputed)
      {
        result.LogoURL = GetBlobObjectURL(result.LogoStorageType, result.LogoKey);
        result.Documents?.ForEach(o => o.Url = GetBlobObjectURL(o.FileStorageType, o.FileKey));
        result.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.Organization), result.SettingsRaw);
        result.ZltoRewardBalance = result.ZltoRewardPool.HasValue ? result.ZltoRewardPool - (result.ZltoRewardCumulative ?? default) : null;
        result.YomaRewardBalance = result.YomaRewardPool.HasValue ? result.YomaRewardPool - (result.YomaRewardCumulative ?? default) : null;
      }

      return result;
    }

    public Settings GetSettingsById(Guid id, bool ensureOrganizationAuthorization)
    {
      var organization = GetById(id, false, false, ensureOrganizationAuthorization);
      return SettingsHelper.Parse(_settingsDefinitionService.ListByEntityType(EntityType.Organization), organization.SettingsRaw);
    }

    public SettingsInfo GetSettingsInfoById(Guid id, bool ensureOrganizationAuthorization)
    {
      var organization = GetById(id, false, false, ensureOrganizationAuthorization);
      return SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.Organization), organization.SettingsRaw);
    }

    public bool EnsureExist(List<Guid> ids, bool throwValidationException)
    {
      ArgumentNullException.ThrowIfNull(ids, nameof(ids));

      var distinctIds = ids.Where(o => o != Guid.Empty).Distinct().ToList();
      if (distinctIds.Count == 0)
        throw new ArgumentException("Empty or invalid", nameof(ids));

      if (_organizationRepository.Query().Count(o => distinctIds.Contains(o.Id)) != distinctIds.Count)
      {
        if (throwValidationException) throw new ValidationException("One or more organizations do not exist or are invalid");
        return false;
      }
      return true;
    }

    public List<Organization> Contains(string value, bool includeChildItems, bool includeComputed)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(value, nameof(value));
      value = value.Trim();

      var results = _organizationRepository.Contains(_organizationRepository.Query(includeChildItems), value).ToList();

      if (includeComputed)
      {
        results.ForEach(o =>
        {
          o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey);
          o.Documents?.ForEach(d => d.Url = GetBlobObjectURL(d.FileStorageType, d.FileKey));
          o.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.Organization), o.SettingsRaw);
          o.ZltoRewardBalance = o.ZltoRewardPool.HasValue ? o.ZltoRewardPool - (o.ZltoRewardCumulative ?? default) : null;
          o.YomaRewardBalance = o.YomaRewardPool.HasValue ? o.YomaRewardPool - (o.YomaRewardCumulative ?? default) : null;
        });
      }

      return results;
    }

    public OrganizationSearchResults Search(OrganizationSearchFilter filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _organizationSearchFilterValidator.ValidateAndThrow(filter);

      var query = _organizationRepository.Query();

      filter.Organizations = filter.Organizations?.Distinct().ToList();
      if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
      {
        if (filter.Organizations != null && filter.Organizations.Count != 0)
          IsAdminsOf(filter.Organizations, true);
        else
          filter.Organizations = [.. ListAdminsOf(false).Select(o => o.Id)];
      }

      if (filter.Organizations != null && filter.Organizations.Count != 0)
        query = query.Where(o => filter.Organizations.Contains(o.Id));

      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = [.. filter.Statuses.Distinct()];
        var statusIds = filter.Statuses.Select(o => _organizationStatusService.GetByName(o.ToString())).Select(o => o.Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      if (!string.IsNullOrEmpty(filter.ValueContains))
        query = _organizationRepository.Contains(query, filter.ValueContains);

      var results = new OrganizationSearchResults();
      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      var resultsInternal = query.ToList();
      resultsInternal.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey));

      results.Items = [.. resultsInternal.Select(o => o.ToInfo())];
      return results;
    }

    public async Task<Organization> Create(OrganizationRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      request.WebsiteURL = request.WebsiteURL?.EnsureHttpsScheme();

      request.Admins = request.Admins?.Select(item =>
      {
        if (string.IsNullOrWhiteSpace(item))
          return item;

        if (item.Contains('@'))
          return item.Trim();

        return item.NormalizePhoneNumber(true);
      }).ToList();

      request.PrimaryContactPhone = request.PrimaryContactPhone?.NormalizePhoneNumber(true);

      await _organizationCreateRequestValidator.ValidateAndThrowAsync(request);

      var existingByName = GetByNameOrNull(request.Name, false, false);
      if (existingByName != null)
        throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' already exists. Please choose a different name");

      //ssi limitation with issuers and verifiers, that requires the wallet label (name) to be unique
      var nameHashValue = HashHelper.ComputeSHA256Hash(request.Name);
      var existingByNameHashValue = _organizationRepository.Query().SingleOrDefault(o => o.NameHashValue == nameHashValue);
      if (existingByNameHashValue != null)
        throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' was previously used.  Please choose a different name");

      var ssoClientSpecified = !string.IsNullOrEmpty(request.SSOClientIdOutbound) || !string.IsNullOrEmpty(request.SSOClientIdInbound);
      if (ssoClientSpecified && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
        throw new SecurityException("Unauthorized");

      var rewardPoolsSpecified = request.ZltoRewardPool.HasValue || request.YomaRewardPool.HasValue;
      if (rewardPoolsSpecified && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
        throw new SecurityException("Unauthorized");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var result = new Organization
      {
        Name = request.Name.NormalizeTrim(),
        NameHashValue = nameHashValue,
        WebsiteURL = request.WebsiteURL?.ToLower(),
        PrimaryContactName = request.PrimaryContactName?.TitleCase(),
        PrimaryContactEmail = request.PrimaryContactEmail?.ToLower(),
        PrimaryContactPhone = request.PrimaryContactPhone,
        VATIN = request.VATIN,
        TaxNumber = request.TaxNumber,
        RegistrationNumber = request.RegistrationNumber,
        City = request.City,
        CountryId = request.CountryId,
        StreetAddress = request.StreetAddress,
        Province = request.Province,
        PostalCode = request.PostalCode,
        Tagline = request.Tagline,
        Biography = request.Biography,
        StatusId = _organizationStatusService.GetByName(OrganizationStatus.Inactive.ToString()).Id, //new organization defaults to inactive / unapproved
        Status = OrganizationStatus.Inactive,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id,
        SSOClientIdOutbound = request.SSOClientIdOutbound,
        SSOClientIdInbound = request.SSOClientIdInbound,
        Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.Organization), (string?)null),
        ZltoRewardPool = request.ZltoRewardPool,
        YomaRewardPool = request.YomaRewardPool,
        ZltoRewardBalance = request.ZltoRewardPool.HasValue ? request.ZltoRewardPool : null,
        YomaRewardBalance = request.YomaRewardPool.HasValue ? request.YomaRewardPool : null
      };

      var blobObjects = new List<BlobObject>();

      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
          //create org
          result = await _organizationRepository.Create(result);

          //assign provider types
          result = await AssignProviderTypes(result, request.ProviderTypes, OrganizationReapprovalAction.None);

          //insert logo
          if (request.Logo != null)
          {
            var resultLogo = await UpdateLogo(result, request.Logo, OrganizationReapprovalAction.None);
            result = resultLogo.Organization;
            blobObjects.Add(resultLogo.ItemAdded);
          }

          //assign admins
          var admins = request.Admins ??= [];
          if (request.AddCurrentUserAsAdmin)
            admins.Add(user.Username);
          else if (HttpContextAccessorHelper.IsUserRoleOnly(_httpContextAccessor))
            throw new ValidationException($"The registering user must be added as an organization admin by default ('{nameof(request.AddCurrentUserAsAdmin)}' must be true)");
          result = await AssignAdmins(result, admins, OrganizationReapprovalAction.None);

          //upload documents
          var resultDocuments = await AddDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocuments, OrganizationReapprovalAction.None);
          result = resultDocuments.Organization;
          blobObjects.AddRange(resultDocuments.ItemsAdded);

          var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
          if (isProviderTypeEducation && (request.EducationProviderDocuments == null || request.EducationProviderDocuments.Count == 0))
            throw new ValidationException($"Education provider type documents are required");

          if (request.EducationProviderDocuments != null && request.EducationProviderDocuments.Count != 0)
          {
            resultDocuments = await AddDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocuments, OrganizationReapprovalAction.None);
            result = resultDocuments.Organization;
            blobObjects.AddRange(resultDocuments.ItemsAdded);
          }

          var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
          if (isProviderTypeMarketplace && (request.BusinessDocuments == null || request.BusinessDocuments.Count == 0))
            throw new ValidationException($"Business documents are required");

          if (request.BusinessDocuments != null && request.BusinessDocuments.Count != 0)
          {
            resultDocuments = await AddDocuments(result, OrganizationDocumentType.Business, request.BusinessDocuments, OrganizationReapprovalAction.None);
            result = resultDocuments.Organization;
            blobObjects.AddRange(resultDocuments.ItemsAdded);
          }

          scope.Complete();
        });
      }
      catch
      {
        //rollback created blobs
        if (blobObjects.Count != 0)
          foreach (var blob in blobObjects)
            await _blobService.Delete(blob);
        throw;
      }

      await SendNotification(result, NotificationType.Organization_Approval_Requested);

      return result;
    }

    public async Task<Organization> Update(OrganizationRequestUpdate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      request.WebsiteURL = request.WebsiteURL?.EnsureHttpsScheme();

      request.Admins = request.Admins?.Select(item =>
      {
        if (string.IsNullOrWhiteSpace(item))
          return item;

        if (item.Contains('@'))
          return item.Trim();

        return item.NormalizePhoneNumber(true);
      }).ToList();

      request.PrimaryContactPhone = request.PrimaryContactPhone?.NormalizePhoneNumber(true);

      await _organizationUpdateRequestValidator.ValidateAndThrowAsync(request);

      var result = GetById(request.Id, true, true, ensureOrganizationAuthorization);

      if (string.Equals(result.Name, _appSettings.YomaOrganizationName, StringComparison.InvariantCultureIgnoreCase)
          && !string.Equals(result.Name, request.Name))
        throw new ValidationException($"{nameof(Organization)} '{result.Name}' is a system organization and its name cannot be changed");

      var statusCurrent = result.Status;

      var existingByName = GetByNameOrNull(request.Name, false, false);
      if (existingByName != null && result.Id != existingByName.Id)
        throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' already exists");

      //ssi limitation with issuers and verifiers, that requires the wallet label (name) to be unique
      var nameHashValue = HashHelper.ComputeSHA256Hash(request.Name);
      var existingByNameHashValue = _organizationRepository.Query().SingleOrDefault(o => o.NameHashValue == nameHashValue);
      if (existingByNameHashValue != null && result.Id != existingByNameHashValue.Id)
        throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' was previously used. Please choose a different name");

      var ssoClientUpdated = !string.Equals(result.SSOClientIdOutbound, request.SSOClientIdOutbound, StringComparison.InvariantCultureIgnoreCase);
      if (!ssoClientUpdated) ssoClientUpdated = !string.Equals(result.SSOClientIdInbound, request.SSOClientIdInbound, StringComparison.InvariantCultureIgnoreCase);
      if (ssoClientUpdated && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
        throw new SecurityException("Unauthorized");

      var rewardPoolsUpdated = request.ZltoRewardPool != result.ZltoRewardPool;
      if (!rewardPoolsUpdated) rewardPoolsUpdated = request.YomaRewardPool != result.YomaRewardPool;
      if (rewardPoolsUpdated && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
        throw new SecurityException("Unauthorized");

      if (request.ZltoRewardPool.HasValue && result.ZltoRewardCumulative.HasValue && request.ZltoRewardPool.Value < result.ZltoRewardCumulative.Value)
        throw new ValidationException($"The Zlto reward pool cannot be less than the cumulative Zlto rewards ({result.ZltoRewardCumulative.Value:F0}) already allocated to participants");

      if (request.YomaRewardPool.HasValue && result.YomaRewardCumulative.HasValue && request.YomaRewardPool.Value < result.YomaRewardCumulative.Value)
        throw new ValidationException($"The Yoma reward pool cannot be less than the cumulative Yoma rewards ({result.YomaRewardCumulative.Value:F2}) already allocated to participants");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      result.Name = request.Name.NormalizeTrim();
      result.WebsiteURL = request.WebsiteURL?.ToLower();
      result.PrimaryContactName = request.PrimaryContactName?.TitleCase();
      result.PrimaryContactEmail = request.PrimaryContactEmail?.ToLower();
      result.PrimaryContactPhone = request.PrimaryContactPhone;
      result.VATIN = request.VATIN;
      result.TaxNumber = request.TaxNumber;
      result.RegistrationNumber = request.RegistrationNumber;
      result.City = request.City;
      result.CountryId = request.CountryId;
      result.StreetAddress = request.StreetAddress;
      result.Province = request.Province;
      result.PostalCode = request.PostalCode;
      result.Tagline = request.Tagline;
      result.Biography = request.Biography;
      result.ModifiedByUserId = user.Id;
      result.SSOClientIdOutbound = request.SSOClientIdOutbound;
      result.SSOClientIdInbound = request.SSOClientIdInbound;
      result.ZltoRewardPool = request.ZltoRewardPool;
      result.YomaRewardPool = request.YomaRewardPool;
      result.ZltoRewardBalance = result.ZltoRewardPool.HasValue ? result.ZltoRewardPool - (result.ZltoRewardCumulative ?? default) : null;
      result.YomaRewardBalance = result.YomaRewardPool.HasValue ? result.YomaRewardPool - (result.YomaRewardCumulative ?? default) : null;

      ValidateUpdatable(result);

      var itemsAdded = new List<BlobObject>();
      var itemsDeleted = new List<(Guid FileId, IFormFile File)>();
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

          //update org
          result = await _organizationRepository.Update(result);

          //provider types
          result = await AssignProviderTypes(result, request.ProviderTypes, OrganizationReapprovalAction.Reapproval);
          result = await RemoveProviderTypes(result, result.ProviderTypes?.Where(o => !request.ProviderTypes.Contains(o.Id)).Select(o => o.Id).ToList(), OrganizationReapprovalAction.None);

          //logo
          if (request.Logo != null)
          {
            var resultLogo = await UpdateLogo(result, request.Logo, OrganizationReapprovalAction.None);
            result = resultLogo.Organization;
            itemsAdded.Add(resultLogo.ItemAdded);
          }

          //admins
          var admins = request.Admins ??= [];
          if (request.AddCurrentUserAsAdmin)
            admins.Add(user.Username);
          result = await RemoveAdmins(result, result.Administrators?.Where(o => !string.IsNullOrEmpty(o.Username) && !admins.Contains(o.Username)).Select(o => o.Username).ToList(), OrganizationReapprovalAction.None);
          result = await AssignAdmins(result, admins, OrganizationReapprovalAction.None);

          //documents
          if (request.RegistrationDocuments != null && request.RegistrationDocuments.Count != 0)
          {
            var resultDocuments = await AddDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocuments, OrganizationReapprovalAction.None);
            result = resultDocuments.Organization;
            itemsAdded.AddRange(resultDocuments.ItemsAdded);
          }

          if (request.RegistrationDocumentsDelete != null && request.RegistrationDocumentsDelete.Count != 0)
          {
            if (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Registration).All(o => request.RegistrationDocumentsDelete.Contains(o.FileId)))
              throw new ValidationException("Registration documents are required. Update will result in no associated documents");

            var resultDelete = await DeleteDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocumentsDelete, OrganizationReapprovalAction.None);
            resultDelete.ItemsDeleted?.ForEach(o => itemsDeleted.Add(new(o.FileId, o.File)));
            result = resultDelete.Organization;
          }

          if (request.EducationProviderDocuments != null && request.EducationProviderDocuments.Count != 0)
          {
            var resultDocuments = await AddDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocuments, OrganizationReapprovalAction.None);
            result = resultDocuments.Organization;
            itemsAdded.AddRange(resultDocuments.ItemsAdded);
          }

          if (request.EducationProviderDocumentsDelete != null && request.EducationProviderDocumentsDelete.Count != 0)
          {
            var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
            if (isProviderTypeEducation && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.EducationProvider).All(o => request.EducationProviderDocumentsDelete.Contains(o.FileId))))
              throw new ValidationException("Education provider type documents are required. Update will result in no associated documents");

            var resultDelete = await DeleteDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocumentsDelete, OrganizationReapprovalAction.None);
            resultDelete.ItemsDeleted?.ForEach(o => itemsDeleted.Add(new(o.FileId, o.File)));
            result = resultDelete.Organization;
          }

          if (request.BusinessDocuments != null && request.BusinessDocuments.Count != 0)
          {
            var resultDocuments = await AddDocuments(result, OrganizationDocumentType.Business, request.BusinessDocuments, OrganizationReapprovalAction.None);
            result = resultDocuments.Organization;
            itemsAdded.AddRange(resultDocuments.ItemsAdded);
          }

          if (request.BusinessDocumentsDelete != null && request.BusinessDocumentsDelete.Count != 0)
          {
            var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
            if (isProviderTypeMarketplace && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Business).All(o => request.BusinessDocumentsDelete.Contains(o.FileId))))
              throw new ValidationException($"Business documents are required. Update will result in no associated documents");

            var resultDelete = await DeleteDocuments(result, OrganizationDocumentType.Business, request.BusinessDocumentsDelete, OrganizationReapprovalAction.None);
            resultDelete.ItemsDeleted?.ForEach(o => itemsDeleted.Add(new(o.FileId, o.File)));
            result = resultDelete.Organization;
          }

          result = await SendForReapproval(result, OrganizationReapprovalAction.Reapproval, OrganizationStatus.Declined, null);

          scope.Complete();
        });
      }
      catch
      {
        //rollback created blobs
        if (itemsAdded.Count != 0)
          foreach (var blob in itemsAdded)
            await _blobService.Delete(blob);

        //re-upload deleted items to blob storage
        foreach (var item in itemsDeleted)
          await _blobService.Create(item.FileId, item.File);

        throw;
      }

      if (statusCurrent != OrganizationStatus.Inactive && result.Status == OrganizationStatus.Inactive)
        await SendNotification(result, NotificationType.Organization_Approval_Requested);

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return result;
    }

    public async Task<Organization> UpdateStatus(Guid id, OrganizationRequestUpdateStatus request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _organizationRequestUpdateStatusValidator.ValidateAndThrowAsync(request);

      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      NotificationType? notificationType = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        switch (request.Status)
        {
          case OrganizationStatus.Active:
            if (result.Status == OrganizationStatus.Active) return;

            if (!Statuses_Activatable.Contains(result.Status))
              throw new ValidationException($"{nameof(Organization)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

            if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

            if (!result.LogoId.HasValue)
              throw new ValidationException("A logo is required to activate the organization. Please add a logo before proceeding");

            result.CommentApproval = request.Comment;

            await _ssiTenantService.ScheduleCreation(EntityType.Organization, result.Id);

            notificationType = NotificationType.Organization_Approval_Approved;
            break;

          case OrganizationStatus.Inactive:
            if (result.Status == OrganizationStatus.Inactive) return;

            if (!Statuses_DeActivatable.Contains(result.Status))
              throw new ValidationException($"{nameof(Organization)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

            if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

            notificationType = NotificationType.Organization_Approval_Requested;
            break;

          case OrganizationStatus.Declined:
            if (result.Status == OrganizationStatus.Declined) return;

            if (!Statuses_Declinable.Contains(result.Status))
              throw new ValidationException($"{nameof(Organization)} can not be declined (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Declinable)}'");

            if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

            result.CommentApproval = request.Comment;

            notificationType = NotificationType.Organization_Approval_Declined;
            break;

          case OrganizationStatus.Deleted:
            if (result.Status == OrganizationStatus.Deleted) return;

            if (!Statuses_CanDelete.Contains(result.Status))
              throw new ValidationException($"{nameof(Organization)} can not be deleted (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");
            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(request), $"{nameof(Status)} of '{request.Status}' not supported");
        }

        var statusId = _organizationStatusService.GetByName(request.Status.ToString()).Id;

        result.StatusId = statusId;
        result.Status = request.Status;
        result.ModifiedByUserId = user.Id;

        result = await _organizationRepository.Update(result);

        scope.Complete();
      });

      if (notificationType.HasValue) await SendNotification(result, notificationType.Value);

      await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return result;
    }

    public async Task<Organization> UpdateSettings(Guid id, SettingsRequest request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _settingsRequestValidator.ValidateAndThrowAsync(request);

      var result = GetById(id, false, false, ensureOrganizationAuthorization);

      var definitions = _settingsDefinitionService.ListByEntityType(EntityType.Organization);

      var currentSettings = SettingsHelper.ToDictionary(result.SettingsRaw);

      SettingsHelper.Validate(definitions, null, request.Settings, currentSettings);

      var settings = request.Settings;
      if (currentSettings != null)
        settings = settings.Concat(currentSettings.Where(kv => !settings.ContainsKey(kv.Key)))
          .ToDictionary(kv => kv.Key, kv => kv.Value);

      result.SettingsRaw = JsonConvert.SerializeObject(settings);
      result = await _organizationRepository.Update(result);

      result.Settings = SettingsHelper.ParseInfo(definitions, settings);
      return result;
    }

    public async Task<Organization> AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
      if (isProviderTypeEducation && (result.Documents == null || !result.Documents.Where(o => o.Type == OrganizationDocumentType.EducationProvider).Any()))
        throw new ValidationException("Education provider type documents are required. Add the required documents before assigning the provider type");

      var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
      if (isProviderTypeMarketplace && (result.Documents == null || !result.Documents.Where(o => o.Type == OrganizationDocumentType.Business).Any()))
        throw new ValidationException($"Business documents are required. Add the required documents before assigning the provider type");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var statusCurrent = result.Status;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignProviderTypes(result, providerTypeIds, OrganizationReapprovalAction.ReapprovalWithNotification);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return result;
    }

    public async Task<Organization> RemoveProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (providerTypeIds == null || providerTypeIds.Count == 0)
        throw new ArgumentNullException(nameof(providerTypeIds));

      ValidateUpdatable(result);

      if (result.ProviderTypes == null || result.ProviderTypes.All(o => providerTypeIds.Contains(o.Id)))
        throw new ValidationException("One or more provider types are required. Removal will result in no associated provider types");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var statusCurrent = result.Status;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveProviderTypes(result, providerTypeIds, OrganizationReapprovalAction.ReapprovalWithNotification);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return result;
    }

    public async Task<Organization> UpdateLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization)
    {
      //determine if the current user context is a user role only. If no user context (system process), IsUserRoleOnly returns false.
      var userRoleOnly = HttpContextAccessorHelper.IsUserRoleOnly(_httpContextAccessor);

      // if ensureOrganizationAuthorization is true, skip authorization if the user is in a user-only role.
      if (ensureOrganizationAuthorization) ensureOrganizationAuthorization = !userRoleOnly;

      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      // only allow a user to add a logo if: they are in a user-only role, the organization has no logo, they are the original creator, and the organization is inactive.
      if (userRoleOnly && (result.LogoId.HasValue || user.Id != result.CreatedByUserId || result.Status != OrganizationStatus.Inactive))
        throw new SecurityException("Unauthorized");

      var statusCurrent = result.Status;

      (Organization? Organization, BlobObject? ItemAdded) resultLogo = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        resultLogo = await UpdateLogo(result, file, OrganizationReapprovalAction.ReapprovalWithNotification);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (resultLogo.Organization == null)
        throw new InvalidOperationException("Organization expected");

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return resultLogo.Organization;
    }

    public async Task<Organization> AddDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var statusCurrent = result.Status;

      (Organization? Organization, List<BlobObject>? ItemsAdded) resultDocuments = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        resultDocuments = await AddDocuments(result, type, documents, OrganizationReapprovalAction.ReapprovalWithNotification);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (resultDocuments.Organization == null)
        throw new InvalidOperationException("Organization expected");

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return resultDocuments.Organization;
    }

    public async Task<Organization> DeleteDocuments(Guid id, OrganizationDocumentType type, List<Guid> documentFileIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      if (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Registration).All(o => documentFileIds.Contains(o.FileId)))
        throw new ValidationException("Registration documents are required. Removal will result in no associated documents");

      var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
      if (isProviderTypeEducation && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.EducationProvider).All(o => documentFileIds.Contains(o.FileId))))
        throw new ValidationException("Education provider type documents are required. Removal will result in no associated documents");

      var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
      if (isProviderTypeMarketplace && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Business).All(o => documentFileIds.Contains(o.FileId))))
        throw new ValidationException($"Business documents are required. Removal will result in no associated documents");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var statusCurrent = result.Status;

      (Organization? Organization, List<OrganizationDocument>? ItemsDeleted) resultDelete = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        resultDelete = await DeleteDocuments(result, type, documentFileIds, OrganizationReapprovalAction.ReapprovalWithNotification);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (resultDelete.Organization == null)
        throw new InvalidOperationException("Organization expected");

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return resultDelete.Organization;
    }

    public async Task<Organization> AssignAdmins(Guid id, List<string> usernames, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (usernames == null || usernames.Count == 0)
        throw new ArgumentNullException(nameof(usernames));

      ValidateUpdatable(result);

      List<string?>? normalizedUsernames = usernames?
        .Select(item =>
        {
          if (string.IsNullOrWhiteSpace(item))
            return (string?)null;

          if (item.Contains('@'))
            return item.Trim();

          return item.NormalizePhoneNumber(true);
        })
        .ToList();

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var statusCurrent = result.Status;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignAdmins(result, normalizedUsernames, OrganizationReapprovalAction.ReapprovalWithNotification);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return result;
    }

    public async Task<Organization> RemoveAdmins(Guid id, List<string> usernames, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (usernames == null || usernames.Count == 0)
        throw new ArgumentNullException(nameof(usernames));

      ValidateUpdatable(result);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var statusCurrent = result.Status;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveAdmins(result, usernames, OrganizationReapprovalAction.ReapprovalWithNotification);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (statusCurrent != result.Status)
        await _mediator.Publish(new OrganizationStatusChangedEvent(result));

      return result;
    }

    public async Task AllocateRewards(Organization organization, decimal? zltoReward, decimal? yomaReward)
    {
      ArgumentNullException.ThrowIfNull(organization, nameof(organization));

      if (zltoReward.HasValue && zltoReward.Value < default(decimal))
        throw new ArgumentOutOfRangeException(nameof(zltoReward), "Zlto reward must be greater than or equal to zero");

      if (yomaReward.HasValue && yomaReward.Value < default(decimal))
        throw new ArgumentOutOfRangeException(nameof(yomaReward), "Yoma reward must be greater than or equal to zero");

      bool rewardCumulativeUpdated = false;
      if (zltoReward.HasValue)
      {
        organization.ZltoRewardCumulative = (organization.ZltoRewardCumulative ?? default) + zltoReward.Value;
        rewardCumulativeUpdated = true;
      }

      if (yomaReward.HasValue)
      {
        organization.YomaRewardCumulative = (organization.YomaRewardCumulative ?? default) + yomaReward.Value;
        rewardCumulativeUpdated = true;
      }

      if (!rewardCumulativeUpdated) return;

      organization.ZltoRewardBalance = organization.ZltoRewardPool.HasValue ? organization.ZltoRewardPool - (organization.ZltoRewardCumulative ?? default) : null;
      organization.YomaRewardBalance = organization.YomaRewardPool.HasValue ? organization.YomaRewardPool - (organization.YomaRewardCumulative ?? default) : null;

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

      organization.ModifiedByUserId = user.Id;
      await _organizationRepository.Update(organization);
    }

    public bool IsAdmin(Guid id, bool throwUnauthorized)
    {
      var org = GetById(id, false, false, false);
      return IsAdmin(org, throwUnauthorized);
    }

    public bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized)
    {
      if (ids.Count == 0) throw new ArgumentNullException(nameof(ids));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

      var result = !ids.Except(orgIds).Any();
      if (!result && throwUnauthorized)
        throw new SecurityException("Unauthorized");

      return result;
    }

    public List<UserInfo> ListAdmins(Guid id, bool includeComputed, bool ensureOrganizationAuthorization)
    {
      var org = GetById(id, true, includeComputed, ensureOrganizationAuthorization);
      return org.Administrators ?? [];
    }

    public List<OrganizationInfo> ListAdminsOf(bool includeComputed)
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

      var organizations = _organizationRepository.Query().Where(o => orgIds.Contains(o.Id)).ToList();
      if (includeComputed) organizations.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey));
      return [.. organizations.Select(o => o.ToInfo())];
    }
    #endregion

    #region Private Members
    private bool IsAdmin(Organization organization, bool throwUnauthorized)
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);

      if (!isAdmin)
      {
        var isOrgAdmin = HttpContextAccessorHelper.IsOrganizationAdminRole(_httpContextAccessor);

        var orgUser = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.UserId == user.Id);

        if (!isOrgAdmin || orgUser == null)
        {
          if (throwUnauthorized) throw new SecurityException("Unauthorized");
          return false;
        }
      }

      return true;
    }

    private async Task<Organization> AssignProviderTypes(Organization organization, List<Guid> providerTypeIds, OrganizationReapprovalAction reapprovalAction)
    {
      if (providerTypeIds == null || providerTypeIds.Count == 0)
        throw new ArgumentNullException(nameof(providerTypeIds));

      var updated = false;
      string? typesAssignedNames = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var typeId in providerTypeIds)
        {
          var type = _providerTypeService.GetById(typeId);

          var itemExisting = organization.ProviderTypes?.SingleOrDefault(o => o.Id == type.Id);
          if (itemExisting != null) continue;

          var item = new Models.OrganizationProviderType
          {
            OrganizationId = organization.Id,
            ProviderTypeId = type.Id
          };

          await _organizationProviderTypeRepository.Create(item);

          organization.ProviderTypes ??= [];
          organization.ProviderTypes.Add(new Models.Lookups.OrganizationProviderType { Id = type.Id, Name = type.Name });

          updated = true;

          typesAssignedNames = $"{typesAssignedNames}{(string.IsNullOrEmpty(typesAssignedNames) ? string.Empty : ", ")}{type.Name}";
        }

        //send for reapproval irrespective of status with type additions
        if (updated)
        {
          var commentApproval = $"Assigned roles '{typesAssignedNames}'";
          organization = await SendForReapproval(organization, reapprovalAction, null, commentApproval);
        }

        scope.Complete();
      });

      return organization;
    }

    private async Task<Organization> RemoveProviderTypes(Organization organization, List<Guid>? providerTypeIds, OrganizationReapprovalAction reapprovalAction)
    {
      if (providerTypeIds == null || providerTypeIds.Count == 0) return organization;

      providerTypeIds = [.. providerTypeIds.Distinct()];

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        var updated = false;
        foreach (var typeId in providerTypeIds)
        {
          var type = _providerTypeService.GetById(typeId);

          var item = _organizationProviderTypeRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.ProviderTypeId == type.Id);
          if (item == null) continue;

          await _organizationProviderTypeRepository.Delete(item);

          organization.ProviderTypes?.Remove(organization.ProviderTypes.Single(o => o.Id == type.Id));

          updated = true;
        }

        if (updated) organization = await SendForReapproval(organization, reapprovalAction, OrganizationStatus.Declined, null);

        scope.Complete();
      });

      return organization;
    }

    private async Task<(Organization Organization, BlobObject ItemAdded)> UpdateLogo(
        Organization organization, IFormFile? file, OrganizationReapprovalAction reapprovalAction)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));

      var currentLogoId = organization.LogoId;

      BlobObject? blobObject = null;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
          blobObject = await _blobService.Create(file, FileType.Photos, StorageType.Public);
          organization.LogoId = blobObject.Id;
          organization.LogoStorageType = blobObject.StorageType;
          organization.LogoKey = blobObject.Key;
          organization = await _organizationRepository.Update(organization);

          if (currentLogoId.HasValue)
            await _blobService.Archive(currentLogoId.Value, blobObject); //preserve / archive previous logo as they might be referenced in credentials

          organization = await SendForReapproval(organization, reapprovalAction, OrganizationStatus.Declined, null);

          scope.Complete();
        });
      }
      catch
      {
        if (blobObject != null)
          await _blobService.Delete(blobObject);
        throw;
      }

      if (blobObject == null)
        throw new InvalidOperationException("Blob object expected");

      organization.LogoURL = GetBlobObjectURL(organization.LogoStorageType, organization.LogoKey);

      return (organization, blobObject);
    }

    private async Task<Organization> AssignAdmins(Organization organization, List<string?>? usernames, OrganizationReapprovalAction reapprovalAction)
    {
      if (usernames == null || usernames.Count == 0)
        throw new ArgumentNullException(nameof(usernames));

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        var updated = false;
        foreach (var username in usernames)
        {
          if (string.IsNullOrWhiteSpace(username)) throw new ArgumentNullException(nameof(usernames), "Contains empty values");

          var user = _userService.GetByUsername(username, false, false);
          if (!user.ExternalId.HasValue)
            throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

          var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.UserId == user.Id);
          if (item == null)
          {

            item = new OrganizationUser
            {
              OrganizationId = organization.Id,
              UserId = user.Id
            };

            await _organizationUserRepository.Create(item);

            organization.Administrators ??= [];
            organization.Administrators.Add(user.ToInfo());

            updated = true;
          }

          //ensure organization admin role
          await _identityProviderClient.EnsureRoles(user.ExternalId.Value, [Constants.Role_OrganizationAdmin]);
        }

        if (updated) organization = await SendForReapproval(organization, reapprovalAction, OrganizationStatus.Declined, null);

        scope.Complete();
      });

      return organization;
    }

    private async Task<Organization> RemoveAdmins(Organization organization, List<string>? usernames, OrganizationReapprovalAction reapprovalAction)
    {
      if (usernames == null || usernames.Count == 0) return organization;

      usernames = [.. usernames.Distinct()];

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        var updated = false;
        foreach (var username in usernames)
        {
          var user = _userService.GetByUsername(username, false, false);
          if (!user.ExternalId.HasValue)
            throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

          var items = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).ToList();

          var item = items.SingleOrDefault(o => o.OrganizationId == organization.Id);
          if (item != null)
          {
            await _organizationUserRepository.Delete(item);
            items.Remove(item);

            organization.Administrators?.Remove(organization.Administrators.Single(o => o.Id == user.Id));

            updated = true;
          }

          if (items.Count == 0) //no longer an admin of any organization, remove organization admin role
            await _identityProviderClient.RemoveRoles(user.ExternalId.Value, [Constants.Role_OrganizationAdmin]);
        }

        if (updated) organization = await SendForReapproval(organization, reapprovalAction, OrganizationStatus.Declined, null);

        scope.Complete();
      });

      return organization;
    }

    private async Task<Organization> SendForReapproval(Organization organization, OrganizationReapprovalAction action, OrganizationStatus? requiredStatus, string? commentApproval)
    {
      switch (action)
      {
        case OrganizationReapprovalAction.None:
          return organization;

        case OrganizationReapprovalAction.Reapproval:
        case OrganizationReapprovalAction.ReapprovalWithNotification:
          if (requiredStatus != null && organization.Status != requiredStatus) return organization;

          if (organization.Status == OrganizationStatus.Inactive) return organization;

          organization.CommentApproval = commentApproval;
          organization.StatusId = _organizationStatusService.GetByName(OrganizationStatus.Inactive.ToString()).Id;
          organization.Status = OrganizationStatus.Inactive;
          organization = await _organizationRepository.Update(organization);

          if (action == OrganizationReapprovalAction.ReapprovalWithNotification)
            await SendNotification(organization, NotificationType.Organization_Approval_Requested);

          break;

        default:
          throw new InvalidOperationException($"Action '{action}' not supported");
      }

      return organization;
    }

    private async Task<(Organization Organization, List<BlobObject> ItemsAdded)> AddDocuments(Organization organization, OrganizationDocumentType type,
        List<IFormFile>? documents, OrganizationReapprovalAction reapprovalAction)
    {
      if (documents == null || documents.Count == 0)
        throw new ArgumentNullException(nameof(documents));

      var itemsNew = new List<OrganizationDocument>();
      var itemsNewBlobs = new List<BlobObject>();
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

          //new items
          foreach (var file in documents)
          {
            //upload new item to blob storage
            var blobObject = await _blobService.Create(file, FileType.Documents, StorageType.Private);
            itemsNewBlobs.Add(blobObject);

            var item = new OrganizationDocument
            {
              OrganizationId = organization.Id,
              FileId = blobObject.Id,
              FileStorageType = blobObject.StorageType,
              FileKey = blobObject.Key,
              Type = type,
              ContentType = file.ContentType,
              OriginalFileName = file.FileName,
              DateCreated = DateTimeOffset.UtcNow
            };

            //create new item in db
            item = await _organizationDocumentRepository.Create(item);
            itemsNew.Add(item);
          }

          organization = await SendForReapproval(organization, reapprovalAction, OrganizationStatus.Declined, null);

          scope.Complete();
        });
      }
      catch //roll back
      {
        //delete newly create items in blob storage
        foreach (var item in itemsNewBlobs)
          await _blobService.Delete(item);

        throw;
      }

      organization.Documents ??= [];
      organization.Documents.AddRange(itemsNew);
      organization.Documents?.ForEach(o => o.Url = GetBlobObjectURL(o.FileStorageType, o.FileKey));

      return (organization, itemsNewBlobs);
    }

    private async Task<(Organization Organization, List<OrganizationDocument>? ItemsDeleted)> DeleteDocuments(Organization organization,
        OrganizationDocumentType type, List<Guid>? documentFileIds, OrganizationReapprovalAction reapprovalAction)
    {
      if (documentFileIds == null || documentFileIds.Count == 0) return (organization, null);

      documentFileIds = [.. documentFileIds.Distinct()];

      var itemsExistingDeleted = new List<OrganizationDocument>();
      var itemsExisting = organization.Documents?.Where(o => o.Type == type && documentFileIds.Contains(o.FileId)).ToList();
      if (itemsExisting == null || itemsExisting.Count == 0) return (organization, null);

      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

          //download and delete existing items in blob storage and db
          foreach (var item in itemsExisting)
          {
            item.File = await _blobService.Download(item.FileId);
            await _organizationDocumentRepository.Delete(item);
            await _blobService.Delete(item.FileId);
            itemsExistingDeleted.Add(item);
          }

          organization = await SendForReapproval(organization, reapprovalAction, OrganizationStatus.Declined, null);

          scope.Complete();
        });
      }
      catch //roll back
      {
        //re-upload existing items to blob storage
        foreach (var item in itemsExistingDeleted)
          await _blobService.Create(item.FileId, item.File);

        throw;
      }

      organization.Documents = organization.Documents?.Except(itemsExisting).ToList();

      return (organization, itemsExisting);
    }

    private string GetBlobObjectURL(StorageType storageType, string key)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      return _blobService.GetURL(storageType, key);
    }

    private string? GetBlobObjectURL(StorageType? storageType, string? key)
    {
      if (!storageType.HasValue || string.IsNullOrEmpty(key)) return null;
      return _blobService.GetURL(storageType.Value, key);
    }

    private static void ValidateUpdatable(Organization organization)
    {
      if (!Statuses_Updatable.Contains(organization.Status))
        throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");
    }

    private async Task SendNotification(Organization organization, NotificationType type)
    {
      try
      {
        List<NotificationRecipient>? recipients = null;

        var dataOrg = new NotificationOrganizationApprovalItem { Name = organization.Name };
        switch (type)
        {
          case NotificationType.Organization_Approval_Requested:
            //send notification to super administrators
            var superAdmins = await _identityProviderClient.ListByRole(Constants.Role_Admin);
            recipients = superAdmins?.Select(o => new NotificationRecipient
            {
              Username = o.Username,
              PhoneNumber = o.PhoneNumber,
              PhoneNumberConfirmed = o.PhoneNumberVerified,
              Email = o.Email,
              EmailConfirmed = o.EmailVerified,
              DisplayName = o.ToDisplayName() ?? o.Username
            }).ToList();

            dataOrg.Comment = organization.CommentApproval;
            dataOrg.URL = _notificationURLFactory.OrganizationApprovalItemURL(type, organization.Id);
            break;

          case NotificationType.Organization_Approval_Approved:
          case NotificationType.Organization_Approval_Declined:
            //send notification to organization administrators
            recipients = organization.Administrators?.Select(o => new NotificationRecipient
            {
              Username = o.Username,
              PhoneNumber = o.PhoneNumber,
              PhoneNumberConfirmed = o.PhoneNumberConfirmed,
              Email = o.Email,
              EmailConfirmed = o.EmailConfirmed,
              DisplayName = o.DisplayName
            }).ToList();

            dataOrg.Comment = organization.CommentApproval;
            dataOrg.URL = _notificationURLFactory.OrganizationApprovalItemURL(type, organization.Id);
            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported");
        }

        var data = new NotificationOrganizationApproval
        {
          Organizations = [dataOrg]
        };

        await _notificationDeliveryService.Send(type, recipients, data);

        _logger.LogInformation("Successfully sent notification");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
      }
    }
    #endregion
  }
}
