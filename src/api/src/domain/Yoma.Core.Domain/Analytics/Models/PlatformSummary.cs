using Yoma.Core.Domain.SSI;

namespace Yoma.Core.Domain.Analytics.Models
{
  public sealed class PlatformMetrics
  {
    // ***Users***
    /// <summary>
    /// Total registered users rounded DOWN to the nearest 100,000
    /// </summary>
    public long UserCount { get; set; }


    // ***Organizations***
    /// <summary>
    /// Active organizations rounded DOWN to the nearest 10
    /// </summary>
    public long OrganizationCount { get; set; }


    // ***Countries***
    /// <summary>
    /// Countries with active organizations (not rounded)
    /// </summary>
    public long CountryCount { get; set; }


    // ***Opportunities***
    /// <summary>
    /// Published opportunities available to youth rounded DOWN to the nearest 10
    /// </summary>
    public long OpportunityCount { get; set; }


    // ***Credentials***
    /// <summary>
    /// Credential counts by schema type rounded DOWN to the nearest 100,000
    /// </summary>
    public List<CredentialMetrics> CredentialSummary { get; set; } = null!;
  }

  public sealed class PlatformMetricsAdmin
  {
    // ***Users***
    /// <summary>
    /// Total registered users (all accounts)
    /// </summary>
    public int UserCount { get; set; }

    /// <summary>
    /// Users actively using Yoma V3 (YoID onboarded)
    /// </summary>
    public int UserCountActive { get; set; }


    // ***Organizations***
    /// <summary>
    /// Total organizations excluding declined
    /// </summary>
    public int OrganizationCount { get; set; }

    /// <summary>
    /// Active organizations
    /// </summary>
    public int OrganizationCountActive { get; set; }


    // ***Countries***
    /// <summary>
    /// Countries represented by organizations (excluding declined)
    /// </summary>
    public int OrganizationCountryCount { get; set; }

    /// <summary>
    /// Countries with active organizations
    /// </summary>
    public int OrganizationCountryCountActive { get; set; }


    // ***Opportunities***
    /// <summary>
    /// Total opportunities irrespective of status
    /// </summary>
    public int OpportunityCount { get; set; }

    /// <summary>
    /// Published opportunities available to youth (active opportunities from active organizations)
    /// </summary>
    public int OpportunityCountPublished { get; set; }


    // ***Credentials***
    /// <summary>
    /// Includes issued and pending (actual counts)
    /// </summary>
    public List<CredentialMetrics> CredentialSummary { get; set; } = null!;
  }

  public sealed class CredentialMetrics
  {
    public SchemaType Type { get; set; }

    /// <summary>
    /// Credential count (actual for admin, rounded for public)
    /// </summary>
    public int Count { get; set; }
  }
}
