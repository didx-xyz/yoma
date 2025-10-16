namespace Yoma.Core.Infrastructure.AriesCloud.Models
{
  public class Connection
  {
    public Guid Id { get; set; }

    public string SourceTenantId { get; set; } = null!;

    public string TargetTenantId { get; set; } = null!;

    public string SourceConnectionId { get; set; } = null!;

    public string TargetConnectionId { get; set; } = null!;

    public string Protocol { get; set; } = null!;

    public DateTimeOffset DateCreated { get; set; }
  }
}
