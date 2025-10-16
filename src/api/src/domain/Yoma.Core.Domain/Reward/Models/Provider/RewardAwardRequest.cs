using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public class RewardAwardRequest
  {
    public Guid Id { get; set; }

    public RewardTransactionEntityType Type { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? Instructions { get; set; }

    public string Username { get; set; } = null!;

    public string UserWalletId { get; set; } = null!;

    public List<Skill>? Skills { get; set; }

    public List<Country>? Countries { get; set; }

    public List<Language>? Languages { get; set; }

    public int TimeInvestedInHours { get; set; }

    public string? ExternalURL { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public decimal Amount { get; set; }
  }
}
