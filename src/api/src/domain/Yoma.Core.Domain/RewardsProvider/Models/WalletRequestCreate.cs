namespace Yoma.Core.Domain.RewardsProvider.Models
{
    public class WalletRequestCreate
    {
        public Guid Id { get; set; }

        public string Email { get; set; }

        public string DisplayName { get; set; }
    }
}
