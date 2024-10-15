namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityResponseVerifyCompletedExternal
  {
    public List<MyOpportunityResponseVerifyStatusExternalUser>? Users { get; set; }
  }

  public class MyOpportunityResponseVerifyStatusExternalUser
  {
    public string Username { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }
  }
}
