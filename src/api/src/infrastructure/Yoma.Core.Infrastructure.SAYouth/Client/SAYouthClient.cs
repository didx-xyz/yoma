using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSharing.Models;
using Yoma.Core.Infrastructure.SAYouth.Extensions;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth.Client
{
  public class SAYouthClient : ISharingProviderClient
  {
    #region Class Variables
    private readonly ILogger<SAYouthClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly SAYouthOptions _options;

    private const string Header_Api_Version = "X-API-VERSION";
    private const string Header_Authorization = "X-API-KEY";

    private static readonly EngagementTypeOption[] EngagementTypes_FaceToFace = [EngagementTypeOption.Offline];
    #endregion

    #region Constructor
    public SAYouthClient(ILogger<SAYouthClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      SAYouthOptions options)
    {
      _logger = logger;
      _environmentProvider = environmentProvider;
      _appSettings = appSettings;
      _options = options;
    }
    #endregion

    #region Public Members
    public async Task<string> CreateOpportunity(OpportunityRequestUpsert request)
    {
      if (!_appSettings.PartnerSharingEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        var mockId = $"MOCK_{Guid.NewGuid():N}";
        _logger.LogInformation("Partner sharing '{action}' skipped for environment '{environment}' and assuming success", nameof(CreateOpportunity), _environmentProvider.Environment);
        return mockId;
      }

      var requestUpsert = ToRequestUpsert(request);

      var response = await _options.BaseUrl
        .AppendPathSegment("Opportunity/Skilling")
        .WithAuthHeaders(GetAuthHeaders())
        .PostJsonAsync(requestUpsert)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<OpportunityUpsertResponse>();

      response.EnsureSuccess();

      return response.Details!.OpportunityId.ToString();
    }

    public async Task UpdateOpportunity(OpportunityRequestUpsert request)
    {
      if (!_appSettings.PartnerSharingEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        _logger.LogInformation("Partner sharing '{action}' skipped for environment '{environment}' and assuming success", nameof(UpdateOpportunity), _environmentProvider.Environment);
        return;
      }

      if (!int.TryParse(request.ExternalId, out var externalIdParsed))
        throw new InvalidOperationException($"Invalid external id '{request.ExternalId}'. Integer expected");

      // at time of execution, if the opportunity end date is in the past, we treat it as an inactivation.
      // this avoids triggering an update, as the external system does not allow closing dates in the past — we pause the opportunity instead.
      var dateEndInThePast = request.Opportunity.DateEnd <= DateTime.UtcNow;
      var opportunityStatus = request.Opportunity.Status;
      if (dateEndInThePast) opportunityStatus = Domain.Opportunity.Status.Inactive;

      if (!dateEndInThePast)
      {
        var requestUpsert = ToRequestUpsert(request);

        var response = await _options.BaseUrl
          .AppendPathSegment("Opportunity/Skilling")
          .SetQueryParam("opportunityId", externalIdParsed)
          .WithAuthHeaders(GetAuthHeaders())
          .PutJsonAsync(requestUpsert)
          .EnsureSuccessStatusCodeAsync()
          .ReceiveJson<OpportunityUpsertResponse>();
      }

      var requestAction = new OpportunityActionRequest { OpportunityId = externalIdParsed };
      StatusAction? action = null;

      switch (opportunityStatus)
      {
        case Domain.Opportunity.Status.Active:
          // ensure not paused
          action = StatusAction.Resume;
          requestAction.ClosingDate = request.Opportunity.DateEnd;
          requestAction.Reason = "Opportunity updated and activated by Yoma";
          break;

        case Domain.Opportunity.Status.Inactive:
          // ensure paused
          action = StatusAction.Pause;
          requestAction.Reason = "Opportunity updated, with end date in the past or explicitly inactivated by Yoma";
          break;

        case Domain.Opportunity.Status.Expired:
          // no further action required
          break;

        default:
          throw new InvalidOperationException($"Invalid / unsupported opportunity status '{request.Opportunity.Status}'");
      }

      if (action == null) return;

      try
      {
        await _options.BaseUrl
            .AppendPathSegment("Opportunity")
            .AppendPathSegment(action.ToString())
            .WithAuthHeaders(GetAuthHeaders())
            .PutJsonAsync(requestAction)
            .EnsureSuccessStatusCodeAsync();
      }
      catch (HttpClientException ex)
      {
        // if we receive a 400 status code, it's likely that the opportunity is already in the desired state (paused or resumed).
        // we assume that the action was already applied and do not need to re-throw the exception.
        if (ex.StatusCode != System.Net.HttpStatusCode.BadRequest) throw;
      }
    }

    public async Task DeleteOpportunity(string externalId)
    {
      if (!_appSettings.PartnerSharingEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        _logger.LogInformation("Partner sharing '{action}' skipped for environment '{environment}' and assuming success", nameof(DeleteOpportunity), _environmentProvider.Environment);
        return;
      }

      if (!int.TryParse(externalId, out var externalIdParsed))
        throw new InvalidOperationException($"Invalid external id '{externalId}'. Integer expected");

      var request = new OpportunityActionRequest
      {
        OpportunityId = externalIdParsed,
        Reason = "Opportunity deleted by Yoma"
      };

      await _options.BaseUrl
      .AppendPathSegment("Opportunity/Delete")
      .WithAuthHeaders(GetAuthHeaders())
      .SendJsonAsync(HttpMethod.Delete, request)
      .EnsureSuccessStatusCodeAsync();
    }
    #endregion

    #region Private Members
    private Dictionary<string, string> GetAuthHeaders()
    {
      return new Dictionary<string, string>
      {
        { Header_Api_Version, _options.ApiVersion },
        { Header_Authorization, _options.ApiKey  }
      };
    }

    private OpportunitySkillingUpsertRequest ToRequestUpsert(OpportunityRequestUpsert request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (request.Opportunity == null)
        throw new ArgumentNullException(nameof(request), "Opportunity is required");

      if (request.Organization == null)
        throw new ArgumentNullException(nameof(request), "Organization is required");

      if (request.OrganizationYoma == null)
        throw new ArgumentNullException(nameof(request), "OrganizationYoma is required");

      //nullable fields matched on SA Youth's request even though not nullable; rely on their error handling
      var requestCreate = new OpportunitySkillingUpsertRequest
      {
        Holder = request.Opportunity.OrganizationName.RemoveSpecialCharacters().TrimToLength(200),
        SponsoringPartner = request.OrganizationYoma.Name.RemoveSpecialCharacters().TrimToLength(200),
        Title = request.Opportunity.Title.RemoveSpecialCharacters().TrimToLength(200),
        Description = request.Opportunity.Description.RemoveMarkdownAsterisks(),
        // ensure 'HasCertification' of type 'NonAccreditedCertification' when 'VerificationEnabled'; Yoma's certification is not accredited 
        HasCertification = request.Opportunity.VerificationEnabled ? YesNoOption.Yes : YesNoOption.No,
        CertificationType = request.Opportunity.VerificationEnabled ? CertificateType.NonAccreditedCertification.ToString() : null,
        CertificationDescription = request.Opportunity.VerificationEnabled ? request.Opportunity.Summary?.RemoveMarkdownAsterisks() : null,
        CloseDate = request.Opportunity.DateEnd,
        Duration = request.Opportunity.ToDuration(),
        Requirements = "Instructions can be found in the description",
        // ensure 'FaceToFace' is set to 'No' so the YOMA link always shows on SA Youth; resulting in no address or contact info being posted; opportunity will always be listed as 'Online Opportunity'
        FaceToFace = YesNoOption.No, //request.Opportunity.EngagementType.HasValue ? EngagementTypes_FaceToFace.Contains(request.Opportunity.EngagementType.Value) ? YesNoOption.Yes : YesNoOption.No : YesNoOption.No,
        Url = request.Opportunity.YomaInfoURL(_appSettings.AppBaseURL)
      };

      requestCreate = ToRequestUpsertAddressInfo(request, requestCreate);
      requestCreate = ToRequestUpsertContactInfo(request, requestCreate);

      return requestCreate;
    }

    private static OpportunitySkillingUpsertRequest ToRequestUpsertAddressInfo(OpportunityRequestUpsert request, OpportunitySkillingUpsertRequest requestUpsert)
    {
      if (requestUpsert.FaceToFace == YesNoOption.No) return requestUpsert;

      var organization = request.Organization; //default to the opportunities associated organization
      if (!request.ShareAddressInfo || !organization.AddressInfoSet()) //if opted not to share or info not set, default to the Yoma organization
      {
        //if the Yoma organization address details are not set, throw an exception, resulting in an retry
        if (!request.OrganizationYoma.AddressInfoSet())
          throw new InvalidOperationException($"Address info is required / expected for organization '{request.OrganizationYoma.Name}'");
        organization = request.OrganizationYoma;
      }

      //nullable fields matched on SA Youth's request even though not nullable; rely on their error handling
      requestUpsert.Address = new Address
      {
        AddressName = organization.Name.RemoveSpecialCharacters().TrimToLength(100),
        AddressLine1 = organization.StreetAddress,
        SuburbName = "n/a",
        CityName = organization.City,
        PostalCode = organization.PostalCode?.RemoveSpecialCharacters().RemoveWhiteSpaces().TrimToLength(4),
        Province = organization.Province?.TrimToLength(50),
      };

      return requestUpsert;
    }

    private static OpportunitySkillingUpsertRequest ToRequestUpsertContactInfo(OpportunityRequestUpsert request, OpportunitySkillingUpsertRequest requestUpsert)
    {
      if (requestUpsert.FaceToFace == YesNoOption.No) return requestUpsert;

      var organization = request.Organization; //default to the opportunities associated organization
      if (!request.ShareContactInfo || !organization.ContactInfoSet()) //if opted not to share or info not set, default to the Yoma organization
      {
        //if the Yoma organization contact details are not set, throw an exception, resulting in an retry
        if (!request.OrganizationYoma.ContactInfoSet())
          throw new InvalidOperationException($"Contact info is required / expected for organization '{request.OrganizationYoma.Name}'");
        organization = request.OrganizationYoma;
      }

      //nullable fields matched on SA Youth's request even though not nullable; rely on their error handling
      requestUpsert.Contact = new Contact
      {
        FirstName = organization.PrimaryContactName?.RemoveSpecialCharacters().TrimToLength(50),
        Surname = organization.PrimaryContactName?.RemoveSpecialCharacters().TrimToLength(50),
        EmailAddress = organization.PrimaryContactEmail,
        PhoneNumber = null // omit phone numbers due to the complexity of global formatting and align Yoma's allowed formatting with SA Youth
      };

      return requestUpsert;
    }
    #endregion
  }
}
