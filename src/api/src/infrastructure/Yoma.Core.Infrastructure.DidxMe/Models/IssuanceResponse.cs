namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  public class IssuanceResponse
  {
    public string Id { get; set; } = null!;

    public string Status { get; set; } = null!;

    public List<IssuedCredential> Credentials { get; set; } = null!;

    public string OfferUri { get; set; } = null!;
  }

  public class IssuedCredential
  {
    public string Id { get; set; } = null!;

    public string Format { get; set; } = null!;
  }
}
