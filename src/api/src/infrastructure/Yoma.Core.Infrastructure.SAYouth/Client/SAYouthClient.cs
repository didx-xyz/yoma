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

    //learning_opportunity_holder >> Org Name
    //learning_opportunity_sponsoring_partner >> Yoma (Youth Agency Marketplace)
    //learning_opportunity_title >> Opp Title
    //learning_opportunity_description >> Opp Description
    //learning_opportunity_has_certification >> Opp VerificationEnabled
    //learning_opportunity_certification_description >> Opp Summary
    //learning_opportunity_certification_type >> NonAccreditedCertification
    //learning_opportunity_close_date >> If no end date don't post
    //learning_opportunity_duration >> If duration exceeds 24 months post null
    //learning_opportunity_requirements >> Hardcoded text (awaiting Sam)
    //learning_opportunity_face_to_face >> Online (No) / Offline (Yes), if null Online
    //learning_opportunity_address >> Org address
    //learning_address_contact >> Org contact else ? (awaiting Sam)
    //learning_opportunity_url >> Yoma URL

    public async Task<string> CreateOpportunity(OpportunityRequestUpsert request)
    {
      //var request = new OpportunitySkillingUpsertRequest
      //{
      //  Holder = opportunity.OrganizationName.RemoveSpecialCharacters().TrimToLength(200),
      //  SponsoringPartner = null,
      //  Title = opportunity.Title.RemoveSpecialCharacters().TrimToLength(200),
      //  Description = opportunity.Description,
      //  HasCertification = opportunity.VerificationEnabled ? YesNoOption.Yes : YesNoOption.No,
      //  CertificationType = CertificateType.AccreditedCertification.ToString(),
      //  CertificationDescription = opportunity.Description,
      //  CloseDate = opportunity.DateEnd,
      //  Duration = opportunity.ToDuration()
      //};

      return await Task.FromResult(Guid.NewGuid().ToString()); //TODO: Implement
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
    #endregion
  }
}
