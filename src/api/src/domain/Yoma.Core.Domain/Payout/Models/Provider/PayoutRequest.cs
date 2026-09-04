namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutRequest
  {
    public Guid TransactionId { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string FirstName { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public string CountryCodeAlpha2 { get; set; } = null!;

    public string Gender { get; set; } = null!;

    public DateTimeOffset DateOfBirth { get; set; }

    public string? Education { get; set; }

    public decimal AmountInUSD { get; set; }
  }
}
