namespace Yoma.Core.Domain.Core.Models
{
  public class BlobObject
  {
    public Guid Id { get; set; }

    public string Key { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
