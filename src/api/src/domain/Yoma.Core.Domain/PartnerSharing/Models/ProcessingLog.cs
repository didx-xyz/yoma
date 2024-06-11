namespace Yoma.Core.Domain.PartnerSharing.Models
{
  public class ProcessingLog
  {
    public Guid Id { get; set; }

    public string EntityType { get; set; }

    public Guid? OpportunityId { get; set; }

    public Guid PartnerId { get; set; }

    public string Action { get; set; }

    public Guid StatusId { get; set; }

    public ProcessingStatus Status { get; set; }  

    public string? EntityExternalId { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
