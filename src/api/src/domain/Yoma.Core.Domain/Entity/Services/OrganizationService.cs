using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.IdentityProvider.Helpers;
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
    private readonly IEmailURLFactory _emailURLFactory;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly OrganizationRequestValidatorCreate _organizationCreateRequestValidator;
    private readonly OrganizationRequestValidatorUpdate _organizationUpdateRequestValidator;
    private readonly OrganizationSearchFilterValidator _organizationSearchFilterValidator;
    private readonly OrganizationRequestUpdateStatusValidator _organizationRequestUpdateStatusValidator;
    private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;
    private readonly IRepository<OrganizationUser> _organizationUserRepository;
    private readonly IRepository<Models.OrganizationProviderType> _organizationProviderTypeRepository;
    private readonly IRepository<OrganizationDocument> _organizationDocumentRepository;
    private readonly IExecutionStrategyService _executionStrategyService;

    private static readonly OrganizationStatus[] Statuses_Updatable = [OrganizationStatus.Active, OrganizationStatus.Inactive, OrganizationStatus.Declined];
    private static readonly OrganizationStatus[] Statuses_Activatable = [OrganizationStatus.Inactive];
    private static readonly OrganizationStatus[] Statuses_CanDelete = [OrganizationStatus.Active, OrganizationStatus.Inactive, OrganizationStatus.Declined];
    private static readonly OrganizationStatus[] Statuses_DeActivatable = [OrganizationStatus.Active, OrganizationStatus.Declined];
    private static readonly OrganizationStatus[] Statuses_Declinable = [OrganizationStatus.Inactive];
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
        IEmailURLFactory emailURLFactory,
        IEmailProviderClientFactory emailProviderClientFactory,
        OrganizationRequestValidatorCreate organizationCreateRequestValidator,
        OrganizationRequestValidatorUpdate organizationUpdateRequestValidator,
        OrganizationSearchFilterValidator organizationSearchFilterValidator,
        OrganizationRequestUpdateStatusValidator organizationRequestUpdateStatusValidator,
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
      _emailURLFactory = emailURLFactory;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _organizationCreateRequestValidator = organizationCreateRequestValidator;
      _organizationUpdateRequestValidator = organizationUpdateRequestValidator;
      _organizationSearchFilterValidator = organizationSearchFilterValidator;
      _organizationRequestUpdateStatusValidator = organizationRequestUpdateStatusValidator;
      _organizationRepository = organizationRepository;
      _organizationUserRepository = organizationUserRepository;
      _organizationProviderTypeRepository = organizationProviderTypeRepository;
      _organizationDocumentRepository = organizationDocumentRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public bool Updatable(Guid id, bool throwNotFound)
    {
      var org = throwNotFound ? GetById(id, false, false, false) : GetByIdOrNull(id, false, false, false);
      if (org == null) return false;
      return Statuses_Updatable.Contains(org.Status);
    }

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
      }

      return result;
    }

    public Organization? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Name.ToLower() == name.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (result == null) return null;

      if (includeComputed)
      {
        result.LogoURL = GetBlobObjectURL(result.LogoStorageType, result.LogoKey);
        result.Documents?.ForEach(o => o.Url = GetBlobObjectURL(o.FileStorageType, o.FileKey));
      }

      return result;
    }

    public List<Organization> Contains(string value, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      var results = _organizationRepository.Contains(_organizationRepository.Query(), value).ToList();

      if (includeComputed)
        results.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey));

      return results;
    }

    public OrganizationSearchResults Search(OrganizationSearchFilter filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter);

      _organizationSearchFilterValidator.ValidateAndThrow(filter);

      var query = _organizationRepository.Query();

      var organizationIds = new List<Guid>();
      if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
        organizationIds.AddRange(ListAdminsOf(false).Select(o => o.Id).ToList());

      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = filter.Statuses.Distinct().ToList();
        var statusIds = filter.Statuses.Select(o => _organizationStatusService.GetByName(o.ToString())).Select(o => o.Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      if (!string.IsNullOrEmpty(filter.ValueContains))
        query = _organizationRepository.Contains(query, filter.ValueContains);

      if (filter.Organizations != null && filter.Organizations.Count != 0)
      {
        filter.Organizations = filter.Organizations.Distinct().ToList();
        organizationIds = organizationIds.Count != 0 ? organizationIds.Intersect(filter.Organizations).ToList() : filter.Organizations;
      }

      if (organizationIds.Count != 0)
        query = query.Where(o => organizationIds.Contains(o.Id));

      var results = new OrganizationSearchResults();
      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      var resultsInternal = query.ToList();
      resultsInternal.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey));

      results.Items = resultsInternal.Select(o => o.ToInfo()).ToList();
      return results;
    }

    public async Task<Organization> Create(OrganizationRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request);

      request.WebsiteURL = request.WebsiteURL?.EnsureHttpsScheme();

      await _organizationCreateRequestValidator.ValidateAndThrowAsync(request);

      var existingByName = GetByNameOrNull(request.Name, false, false);
      if (existingByName != null)
        throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' already exists. Please choose a different name");

      //ssi limitation with issuers and verifiers, that requires the wallet label (name) to be unique
      var nameHashValue = HashHelper.ComputeSHA256Hash(request.Name);
      var existingByNameHashValue = _organizationRepository.Query().SingleOrDefault(o => o.NameHashValue == nameHashValue);
      if (existingByNameHashValue != null)
        throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' was previously used.  Please choose a different name");

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

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
        ModifiedByUserId = user.Id
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
          var resultLogo = await UpdateLogo(result, request.Logo, OrganizationReapprovalAction.None);
          result = resultLogo.Organization;
          blobObjects.Add(resultLogo.ItemAdded);

          //assign admins
          var admins = request.AdminEmails ??= [];
          if (request.AddCurrentUserAsAdmin)
            admins.Add(user.Email);
          else if (HttpContextAccessorHelper.IsUserRoleOnly(_httpContextAccessor))
            throw new ValidationException($"The registering user must be added as an organization admin by default ('{nameof(request.AddCurrentUserAsAdmin)}' must be true).");
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

      await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Requested);

      return result;
    }

    public async Task<Organization> Update(OrganizationRequestUpdate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      request.WebsiteURL = request.WebsiteURL?.EnsureHttpsScheme();

      await _organizationUpdateRequestValidator.ValidateAndThrowAsync(request);

      var result = GetById(request.Id, true, true, ensureOrganizationAuthorization);

      if (string.Equals(result.Name, _appSettings.SSIIssuerNameYomaOrganization, StringComparison.InvariantCultureIgnoreCase)
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

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

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
          var admins = request.AdminEmails ??= [];
          if (request.AddCurrentUserAsAdmin)
            admins.Add(user.Email);
          result = await RemoveAdmins(result, result.Administrators?.Where(o => !admins.Contains(o.Email)).Select(o => o.Email).ToList(), OrganizationReapprovalAction.None);
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
        await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Requested);

      return result;
    }

    public async Task<Organization> UpdateStatus(Guid id, OrganizationRequestUpdateStatus request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      await _organizationRequestUpdateStatusValidator.ValidateAndThrowAsync(request);

      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

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

            result.CommentApproval = request.Comment;

            await _ssiTenantService.ScheduleCreation(EntityType.Organization, result.Id);

            await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Approved);

            break;

          case OrganizationStatus.Inactive:
            if (result.Status == OrganizationStatus.Inactive) return;

            if (!Statuses_DeActivatable.Contains(result.Status))
              throw new ValidationException($"{nameof(Organization)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

            if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

            await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Requested);
            break;

          case OrganizationStatus.Declined:
            if (result.Status == OrganizationStatus.Declined) return;

            if (!Statuses_Declinable.Contains(result.Status))
              throw new ValidationException($"{nameof(Organization)} can not be declined (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Declinable)}'");

            if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

            result.CommentApproval = request.Comment;

            await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Declined);

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

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignProviderTypes(result, providerTypeIds, OrganizationReapprovalAction.ReapprovalWithEmail);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

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

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveProviderTypes(result, providerTypeIds, OrganizationReapprovalAction.ReapprovalWithEmail);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Organization> UpdateLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      (Organization? Organization, BlobObject? ItemAdded) resultLogo = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        resultLogo = await UpdateLogo(result, file, OrganizationReapprovalAction.ReapprovalWithEmail);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (resultLogo.Organization == null)
        throw new InvalidOperationException("Organization expected");

      return resultLogo.Organization;
    }

    public async Task<Organization> AddDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      (Organization? Organization, List<BlobObject>? ItemsAdded) resultDocuments = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        resultDocuments = await AddDocuments(result, type, documents, OrganizationReapprovalAction.ReapprovalWithEmail);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (resultDocuments.Organization == null)
        throw new InvalidOperationException("Organization expected");

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

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      (Organization? Organization, List<OrganizationDocument>? ItemsDeleted) resultDelete = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        resultDelete = await DeleteDocuments(result, type, documentFileIds, OrganizationReapprovalAction.ReapprovalWithEmail);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      if (resultDelete.Organization == null)
        throw new InvalidOperationException("Organization expected");

      return resultDelete.Organization;
    }

    public async Task<Organization> AssignAdmins(Guid id, List<string> emails, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignAdmins(result, emails, OrganizationReapprovalAction.ReapprovalWithEmail);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Organization> RemoveAdmins(Guid id, List<string> emails, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (emails == null || emails.Count == 0)
        throw new ArgumentNullException(nameof(emails));

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveAdmins(result, emails, OrganizationReapprovalAction.ReapprovalWithEmail);
        result.ModifiedByUserId = user.Id;
        result = await _organizationRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public bool IsAdmin(Guid id, bool throwUnauthorized)
    {
      var org = GetById(id, false, false, false);
      return IsAdmin(org, throwUnauthorized);
    }

    public bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized)
    {
      if (ids.Count == 0) throw new ArgumentNullException(nameof(ids));

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
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
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

      var organizations = _organizationRepository.Query().Where(o => orgIds.Contains(o.Id)).ToList();
      if (includeComputed) organizations.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey));
      return organizations.Select(o => o.ToInfo()).ToList();
    }
    #endregion

    #region Private Members
    private bool IsAdmin(Organization organization, bool throwUnauthorized)
    {
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      OrganizationUser? orgUser = null;
      var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);
      if (!isAdmin) orgUser = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.UserId == user.Id);

      if (!isAdmin && orgUser == null && throwUnauthorized)
        throw new SecurityException("Unauthorized");
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
          await SendForReapproval(organization, reapprovalAction, null, commentApproval);
        }

        scope.Complete();
      });

      return organization;
    }

    private async Task<Organization> RemoveProviderTypes(Organization organization, List<Guid>? providerTypeIds, OrganizationReapprovalAction reapprovalAction)
    {
      if (providerTypeIds == null || providerTypeIds.Count == 0) return organization;

      providerTypeIds = providerTypeIds.Distinct().ToList();

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
      ArgumentNullException.ThrowIfNull(file);

      var currentLogoId = organization.LogoId;

      BlobObject? blobObject = null;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
          blobObject = await _blobService.Create(file, FileType.Photos);
          organization.LogoId = blobObject.Id;
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

    private async Task<Organization> AssignAdmins(Organization organization, List<string> emails, OrganizationReapprovalAction reapprovalAction)
    {
      if (emails == null || emails.Count == 0)
        throw new ArgumentNullException(nameof(emails));

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        var updated = false;
        foreach (var email in emails)
        {
          var user = _userService.GetByEmail(email, false, false);
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

    private async Task<Organization> RemoveAdmins(Organization organization, List<string>? emails, OrganizationReapprovalAction reapprovalAction)
    {
      if (emails == null || emails.Count == 0) return organization;

      emails = emails.Distinct().ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        var updated = false;
        foreach (var email in emails)
        {
          var user = _userService.GetByEmail(email, false, false);
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
        case OrganizationReapprovalAction.ReapprovalWithEmail:
          if (requiredStatus != null && organization.Status != requiredStatus) return organization;

          if (organization.Status == OrganizationStatus.Inactive) return organization;

          organization.CommentApproval = commentApproval;
          organization.Status = OrganizationStatus.Inactive;
          organization.StatusId = _organizationStatusService.GetByName(OrganizationStatus.Inactive.ToString()).Id;
          organization = await _organizationRepository.Update(organization);

          if (action == OrganizationReapprovalAction.ReapprovalWithEmail)
            await SendEmail(organization, EmailProvider.EmailType.Organization_Approval_Requested);

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
            var blobObject = await _blobService.Create(file, FileType.Documents);
            itemsNewBlobs.Add(blobObject);

            var item = new OrganizationDocument
            {
              OrganizationId = organization.Id,
              FileId = blobObject.Id,
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

      documentFileIds = documentFileIds.Distinct().ToList();

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
      ArgumentException.ThrowIfNullOrWhiteSpace(key);
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

    private async Task SendEmail(Organization organization, EmailProvider.EmailType type)
    {
      try
      {
        List<EmailRecipient>? recipients = null;

        var dataOrg = new EmailOrganizationApprovalItem { Name = organization.Name };
        switch (type)
        {
          case EmailProvider.EmailType.Organization_Approval_Requested:
            //send email to super administrators
            var superAdmins = await _identityProviderClient.ListByRole(Constants.Role_Admin);
            recipients = superAdmins?.Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.ToDisplayName() }).ToList();

            dataOrg.Comment = organization.CommentApproval;
            dataOrg.URL = _emailURLFactory.OrganizationApprovalItemURL(type, organization.Id);
            break;

          case EmailProvider.EmailType.Organization_Approval_Approved:
          case EmailProvider.EmailType.Organization_Approval_Declined:
            //send email to organization administrators
            recipients = organization.Administrators?.Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.DisplayName }).ToList();

            dataOrg.Comment = organization.CommentApproval;
            dataOrg.URL = _emailURLFactory.OrganizationApprovalItemURL(type, organization.Id);
            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported");
        }

        if (recipients == null || recipients.Count == 0) return;

        var data = new EmailOrganizationApproval
        {
          Organizations = [dataOrg]
        };

        await _emailProviderClient.Send(type, recipients, data);

        _logger.LogInformation("Successfully send '{emailType}' email", type);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send '{emailType}' email", type);
      }
    }
    #endregion
  }
}
