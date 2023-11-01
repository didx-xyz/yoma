using Yoma.Core.Domain.Entity;

namespace Yoma.Core.Domain.SSI.Models
{
    public class SSITenantCreation
    {
        public Guid Id { get; set; }

        public EntityType EntityType { get; set; }

        public Guid StatusId { get; set; }

        public TenantCreationStatus Status { get; set; }

        public Guid? UserId { get; set; }

        public Guid? OrganizationId { get; set; }

        public string? TenantId { get; set; }

        public string? ErrorReason { get; set; }

        public byte? RetryCount { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }
    }
}
