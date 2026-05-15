namespace Yoma.Core.Infrastructure.Alison.Models
{
  public sealed class Opportunity
  {
    public Guid Id { get; set; }

    public string ExternalId { get; set; } = null!;

    public string PayloadHash { get; set; } = null!;

    public string PayloadJson { get; set; } = null!;

    public bool? Deleted { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
