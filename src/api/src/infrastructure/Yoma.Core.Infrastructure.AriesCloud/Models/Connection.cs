namespace Yoma.Core.Infrastructure.AriesCloud.Models
{
    public class Connection
    {
        public string SourceTenantId { get; set; }

        public string TargetTenantId { get; set; }

        public string SourceConnectionId { get; set; }

        public string TargetConnectionId { get; set; }

        public string Protocol { get; set; }
    }
}
