namespace Yoma.Core.Domain.Entity.Models
{
  public class OrganizationProviderType
  {
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid ProviderTypeId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
