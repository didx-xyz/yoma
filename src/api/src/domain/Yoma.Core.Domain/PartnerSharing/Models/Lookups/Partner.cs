namespace Yoma.Core.Domain.PartnerSharing.Models.Lookups
{
  public class Partner
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public bool Active { get; set; }

    public string? ActionEnabled { get; set; }

    public Dictionary<ProcessingAction, bool> ActionEnabledParsed { get; set; } = null!; //defaults to true if not explicitly defined
  }
}
