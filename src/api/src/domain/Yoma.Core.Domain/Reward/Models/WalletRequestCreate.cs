namespace Yoma.Core.Domain.Reward.Models
{
    public class WalletRequestCreate
    {
        public Guid Id { get; set; }

        public string Email { get; set; }

        public string DisplayName { get; set; }

        public decimal? Balance { get; set; }
    }
}
