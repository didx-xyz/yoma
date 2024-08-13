using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSharing.Models;
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
      return Guid.NewGuid().ToString(); //TODO: Implement 

      //var requestUpsert = ToRequestUpsert(request);

      //var response = await _options.BaseUrl
      //  .AppendPathSegment("/Opportunity/Skilling")
      //  .WithAuthHeaders(GetAuthHeaders())
      //  .PostJsonAsync(requestUpsert)
      //  .EnsureSuccessStatusCodeAsync()
      //  .ReceiveJson<OpportunityUpsertResponse>();

      //if (response.Details == null)
      //  throw new InvalidOperationException("Opportunity creation failed");

      //return response.Details.OpportunityId.ToString();
    }

    public async Task UpdateOpportunity(OpportunityRequestUpsert request)
    {
      await Task.CompletedTask; //TODO: Implement
    }

    public async Task DeleteOpportunity(string externalId)
    {
      await Task.CompletedTask; //TODO: Implement
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

    //private OpportunitySkillingUpsertRequest ToRequestUpsert(OpportunityRequestUpsert request)
    //{
    //  ArgumentNullException.ThrowIfNull(request, nameof(request));

    //  if (request.Opportunity == null)
    //    throw new ArgumentNullException(nameof(request), "Opportunity is required");

    //  if (request.OrganizationYoma == null)
    //    throw new ArgumentNullException(nameof(request), "OrganizationYoma is required");

    //  var result = new OpportunitySkillingUpsertRequest
    //  {
    //    Holder = request.Opportunity.OrganizationName.RemoveSpecialCharacters().TrimToLength(200),
    //    SponsoringPartner = request.OrganizationYoma.Name.RemoveSpecialCharacters().TrimToLength(200),
    //    Title = request.Opportunity.Title.RemoveSpecialCharacters().TrimToLength(200),
    //    Description = request.Opportunity.Description,
    //    HasCertification = request.Opportunity.VerificationEnabled ? YesNoOption.Yes : YesNoOption.No,
    //    CertificationType = CertificateType.AccreditedCertification.ToString(),
    //    CertificationDescription = request.Opportunity.Summary,
    //    CloseDate = request.Opportunity.DateEnd,
    //    Duration = request.Opportunity.ToDuration(),
    //    Requirements = "Instructions can be found in the description",
    //    //FaceToFace = request.Opportunity.EngagementType ? YesNoOption.No : YesNoOption.Yes,
    //    Url = request.Opportunity.YomaInfoURL(_appSettings.AppBaseURL)
    //  };

    //  if (result.FaceToFace == YesNoOption.Yes)
    //  {
    //    result.Address = new Address
    //    {
    //      AddressName = request.OrganizationYoma.Name.RemoveSpecialCharacters().TrimToLength(100),
    //      AddressLine1 = request.OrganizationYoma.StreetAddress,
    //      SuburbName = "n/a",
    //      CityName = request.OrganizationYoma.City,
    //      PostalCode = request.OrganizationYoma.PostalCode,
    //      Province = request.OrganizationYoma.Province,
    //    };

    //    result.Contact = new Contact
    //    {
    //      FirstName = request.OrganizationYoma.PrimaryContactName,
    //      Surname = request.OrganizationYoma.PrimaryContactName,
    //      EmailAddress = request.OrganizationYoma.PrimaryContactEmail,
    //      PhoneNumber = request.OrganizationYoma.PrimaryContactPhone
    //    };
    //  }

    //  return result;
    //}
    #endregion
  }
}
