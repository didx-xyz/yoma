namespace Yoma.Core.Infrastructure.AriesCloud.Models
{
  public class Connection
  {
    public Guid Id { get; set; }

    public string SourceTenantId { get; set; }

    public string TargetTenantId { get; set; }

    public string SourceConnectionId { get; set; }

    public string TargetConnectionId { get; set; }

    public string Protocol { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
