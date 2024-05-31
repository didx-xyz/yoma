namespace Yoma.Core.Domain.Analytics.Interfaces
{
  //applies to filters relating to engagement (viewed and / or completed), namely OrganizationSearchFilterEngagement and OrganizationSearchFilterYouth
  public interface IOrganizationSearchFilterEngagement : IOrganizationSearchFilterBase
  {
    //list of countries associated with users that engaged with opportunities (viewed and / or completed)
    List<Guid>? Countries { get; set; }
  }
}
