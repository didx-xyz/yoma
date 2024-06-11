namespace Yoma.Core.Domain.PartnerSharing.Models.Lookups
{
  public class Partner
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public bool Active { get; set; }

    public string? ActionEnabled { get; set; }

    public Dictionary<ProcessingAction, bool> ActionEnabledParsed { get; set; } //defaults to true if not explicitly defined
  }
}
