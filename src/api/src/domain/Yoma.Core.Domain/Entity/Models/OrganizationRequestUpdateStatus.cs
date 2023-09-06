namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationRequestUpdateStatus
    {
        public OrganizationStatus Status { get; set; }

        public string? Comment { get; set;  } //applies to approval and required with decline
    }
}
